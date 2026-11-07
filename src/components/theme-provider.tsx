"use client";
import { deepStrictEqual } from "assert";
import { fdatasync } from "fs";
import { LucideSquareDashedTopSolid } from "lucide-react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { decodeStageUntilBoundary } from "next/dist/client/components/router-reducer/fetch-server-response";
import { sendStatusCode } from "next/dist/server/api-utils";
import { DANGEROUSLY_runPendingImmediatesAfterCurrentTask } from "next/dist/server/node-environment-extensions/fast-set-immediate.external";
import { Afacad_Flux } from "next/font/google";
import type { ComponentProps } from "react";
import { addAbortSignal } from "stream";

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />;
}
