/**
 * ============================================================
 * PAYMENT METHOD — Gateway transactions (superadmin)
 * ============================================================
 * GET: returns the gateway audit list (payment_transactions) plus
 * the eSewa/Khalti configuration status (configured? which mode?).
 *
 * SECURITY:
 *   - Requires the VIEW_PAYMENTS permission.
 *   - NEVER returns secrets — the status payload only exposes
 *     booleans (configured) and the test/live mode derived from
 *     the API base URLs. Secret keys stay server-side in env.
 * ============================================================
 */
import { NextResponse } from "next/server";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { getGatewayTransactions } from "@/db/services/paymentTransactions";
import { getEsewaConfig } from "@/lib/payments/esewa";
import { getKhaltiConfig } from "@/lib/payments/khalti";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_PAYMENTS);
    if (user instanceof NextResponse) return user;

    const [transactions] = await Promise.all([getGatewayTransactions()]);

    // Status is derived server-side; secrets never leave the server.
    const esewaConfig = getEsewaConfig();
    const khaltiConfig = getKhaltiConfig();

    const esewaMode = /rc-epay\.esewa\.com\.np|rc\.esewa\.com\.np/.test(
      esewaConfig.paymentUrl + esewaConfig.statusUrl,
    )
      ? "test"
      : "live";
    const khaltiMode = /dev\.khalti\.com/.test(khaltiConfig.apiBaseUrl)
      ? "test"
      : "live";

    return NextResponse.json({
      transactions,
      status: {
        esewa: {
          configured: Boolean(esewaConfig.secretKey),
          mode: esewaMode,
        },
        khalti: {
          configured: Boolean(khaltiConfig.secretKey),
          mode: khaltiMode,
        },
      },
    });
  } catch (error) {
    console.error("Failed to load gateway transactions", error);
    return NextResponse.json(
      { error: "Unable to load gateway transactions" },
      { status: 500 },
    );
  }
}