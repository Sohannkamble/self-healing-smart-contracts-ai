// scripts/approveAndApply.js
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using deployer:", deployer.address);

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments.local.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("deployments.local.json not found. Run deploy_auto.js first.");
  }

  const deployInfo = JSON.parse(fs.readFileSync(deploymentPath));
  const vulnAddr = deployInfo.contracts.VulnerableContract;
  const patchedAddr = deployInfo.contracts.PatchedContractAuto;
  const managerAddr = deployInfo.contracts.PatchManager;

  console.log("\nLoaded deployment info:");
  console.log("VulnerableContract:", vulnAddr);
  console.log("PatchedContractAuto:", patchedAddr);
  console.log("PatchManager:", managerAddr);

  const manager = await ethers.getContractAt("PatchManager", managerAddr);

  console.log("\nProposing Patch...");
  await manager.proposePatch(
    vulnAddr,
    patchedAddr,
    "QmFakeHashForDemo",
    "AI auto patch: reentrancy fix"
  );

  console.log("Approving Patch (ID = 0)...");
  await manager.approvePatch(0);

  console.log("Applying Patch...");
  await manager.applyPatch(0);

  const patch = await manager.getPatch(0);
  console.log("\nPatch after Applying:");
  console.log(patch);

  if (patch.status.toString() === "2") {
    console.log("\n🎉 Patch Successfully Applied!");
  } else {
    console.log("\n⚠ Patch Status Not Final. Check System.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
