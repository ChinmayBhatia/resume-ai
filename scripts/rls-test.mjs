import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseEmail = process.env.RLS_TEST_EMAIL;
if (!url || !key || !serviceKey || !baseEmail) {
  console.error("Needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local, and RLS_TEST_EMAIL set.");
  process.exit(1);
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const fresh = () => createClient(url, key, opts);
const admin = createClient(url, serviceKey, opts); // only used to create and delete test users

let failures = 0;
const check = (name, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failures++;
};
const pdf = () => new Blob(["%PDF-1.4 test"], { type: "application/pdf" });

const createdIds = [];
let cleanupPath = null;

async function makeUser(label) {
  const email = baseEmail.replace("@", `+rls-${label}-${randomUUID().slice(0, 8)}@`);
  const password = `Test-${randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: `RLS ${label}` },
  });
  if (error || !data.user) throw new Error(`Could not create a test user: ${error?.message ?? "unknown"}`);
  createdIds.push(data.user.id);
  const c = fresh();
  const { error: signInError } = await c.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`Could not sign in a test user: ${signInError.message}`);
  return { c, id: data.user.id };
}

try {
  const A = await makeUser("a");
  const B = await makeUser("b");
  const anon = fresh();

  const resumeId = randomUUID();
  const path = `${A.id}/${resumeId}.pdf`;
  cleanupPath = path;

  const r = await A.c.from("resumes")
    .insert({ id: resumeId, filename: "a.pdf", storage_path: path, file_type: "PDF", file_size: 10, extracted_text: "secret resume text" })
    .select("id").single();
  check("A can create a resume", !r.error);
  if (r.error) throw new Error(r.error.message);

  const iv = await A.c.from("interviews")
    .insert({ resume_id: resumeId, interview_type: "Mixed", difficulty: "Beginner", question_count: 10 })
    .select("id").single();
  check("A can create an interview", !iv.error);

  const rep = await A.c.from("ats_reports")
    .insert({ resume_id: resumeId, score: 50, analysis_json: {} })
    .select("id").single();
  check("A can create an ATS report", !rep.error);

  const usage = await A.c.from("ai_usage").insert({ endpoint: "rls_test" });
  check("A can log AI usage", !usage.error);

  const up = await A.c.storage.from("resumes").upload(path, pdf(), { contentType: "application/pdf" });
  check("A can upload a file", !up.error);

  const bRes = await B.c.from("resumes").select("id").eq("id", resumeId);
  check("B cannot read A's resume", !bRes.error && bRes.data.length === 0);

  const bUpd = await B.c.from("resumes").update({ filename: "hacked.pdf" }).eq("id", resumeId).select("id");
  check("B cannot update A's resume", !bUpd.error && bUpd.data.length === 0);

  const bDel = await B.c.from("resumes").delete().eq("id", resumeId).select("id");
  check("B cannot delete A's resume", !bDel.error && bDel.data.length === 0);

  const intact = await A.c.from("resumes").select("filename").eq("id", resumeId).single();
  check("A's resume is unchanged", intact.data?.filename === "a.pdf");

  const spoof = await B.c.from("resumes").insert({
    user_id: A.id, filename: "x.pdf", storage_path: `${A.id}/${randomUUID()}.pdf`, file_type: "PDF", file_size: 1,
  });
  check("B cannot create rows owned by A", !!spoof.error);

  const link = await B.c.from("interviews")
    .insert({ resume_id: resumeId, interview_type: "Mixed", difficulty: "Beginner", question_count: 10 });
  check("B cannot start an interview on A's resume", !!link.error);

  const bInt = await B.c.from("interviews").select("id").eq("id", iv.data?.id ?? randomUUID());
  check("B cannot read A's interview", !bInt.error && bInt.data.length === 0);

  const bRep = await B.c.from("ats_reports").select("id").eq("id", rep.data?.id ?? randomUUID());
  check("B cannot read A's ATS report", !bRep.error && bRep.data.length === 0);

  const bUse = await B.c.from("ai_usage").select("id");
  check("B cannot see A's AI usage", !bUse.error && bUse.data.length === 0);

  const bProf = await B.c.from("profiles").select("id").eq("id", A.id);
  check("B cannot read A's profile", !bProf.error && bProf.data.length === 0);

  const dl = await B.c.storage.from("resumes").download(path);
  check("B cannot download A's file", !!dl.error);

  const sig = await B.c.storage.from("resumes").createSignedUrl(path, 60);
  check("B cannot create a link to A's file", !!sig.error);

  const inject = await B.c.storage.from("resumes")
    .upload(`${A.id}/${randomUUID()}.pdf`, pdf(), { contentType: "application/pdf" });
  check("B cannot upload into A's folder", !!inject.error);

  const anonRes = await anon.from("resumes").select("id");
  check("Logged-out client sees no resumes", !!anonRes.error || anonRes.data.length === 0);

  const anonDl = await anon.storage.from("resumes").download(path);
  check("Logged-out client cannot download files", !!anonDl.error);
} catch (e) {
  console.error("Test aborted:", e.message);
  failures++;
} finally {
  // Remove the test files and users. Deleting a user cascades to all of their rows.
  if (cleanupPath) await admin.storage.from("resumes").remove([cleanupPath]).catch(() => {});
  for (const id of createdIds) await admin.auth.admin.deleteUser(id).catch(() => {});
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED. Do not deploy until these are fixed.`);
process.exit(failures === 0 ? 0 : 1);