import "../../envConfig";

import { ensureStandardAccounts } from "@/db/services/accounting";

async function main() {
  await ensureStandardAccounts();
  console.log("Standard chart of accounts ensured.");
}

main()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed to seed chart of accounts:", err);
    process.exit(1);
  });
