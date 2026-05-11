import { NextResponse } from "next/server";

import { runDailyGeneration } from "@/features/daily-materials/daily-materials-generator";

export async function POST(request: Request) {
  const secret = process.env.DAILY_JOB_SECRET;

  if (!secret) {
    return NextResponse.json(
      { ok: false, status: "failed", error: "DAILY_JOB_SECRET 未配置。" },
      { status: process.env.NODE_ENV === "production" ? 503 : 500 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!token || token !== secret) {
    return NextResponse.json(
      { ok: false, status: "unauthorized", error: "Unauthorized" },
      { status: 401 },
    );
  }

  const result = await runDailyGeneration({ source: "api", requireEnabled: true });
  return NextResponse.json(result, {
    status: result.ok ? 200 : 500,
  });
}
