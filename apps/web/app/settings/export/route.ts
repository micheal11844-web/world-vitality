import { NextResponse } from "next/server";
import { buildUserDataExport } from "@world-vitality/identity-service";
import { getAccountService } from "../../../lib/account";
import { getSessionUserId } from "../../../lib/get-session-user-id";
import { logSecurity, logTelemetry } from "../../../lib/logger";

export const dynamic = "force-dynamic";

/**
 * One-click data export (BUILD_PLAN "STAGE — ACCOUNT SETTINGS + SIGN
 * OUT"; Constitution Section 2, Principle 5). Builds the JSON on
 * request and returns it as a download — no job queue, no "pending"
 * state, nothing to wait on. See `buildUserDataExport`'s doc comment
 * for exactly what is and isn't included.
 *
 * `Cache-Control: no-store` — this is personal data and must never sit
 * in a shared cache.
 */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  try {
    const data = await buildUserDataExport(getAccountService(), userId);
    const day = data.exportedAt.slice(0, 10);
    logTelemetry.event("data_exported");
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="world-vitality-data-${day}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    logSecurity.error("data_export_failed", err, { userId });
    return NextResponse.json(
      { error: "Couldn't build your export. Please try again." },
      { status: 500 },
    );
  }
}
