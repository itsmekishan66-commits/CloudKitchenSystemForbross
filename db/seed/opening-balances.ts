import "../../envConfig";

import { backfillOpeningBalances } from "@/db/services/accounting";

async function main() {
  const count = await backfillOpeningBalances();
  console.log(`Backfilled opening balances for ${count} accounts.`);
}

main()
  .then(() => {
    console.log("Opening balance backfill complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
