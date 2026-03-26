// scripts/deploy_auto.js
// Fresh deployment of:
// - VulnerableContract
// - PatchedContractAuto (AI-generated patch)
// - PatchManager
//
// Also saves deployed addresses to deployments.local.json for later use.

const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1) Deploy VulnerableContract
  const Vulnerable = await ethers.getContractFactory("VulnerableContract");
  const vuln = await Vulnerable.deploy();
  await vuln.waitForDeployment();
  const vulnAddr = await vuln.getAddress();
  console.log("VulnerableContract:", vulnAddr);

  // 2) Deploy PatchedContractAuto (AI-generated)
  const PatchedAuto = await ethers.getContractFactory("PatchedContractAuto");
  const patchedAuto = await PatchedAuto.deploy();
  await patchedAuto.waitForDeployment();
  const patchedAddr = await patchedAuto.getAddress();
  console.log("PatchedContractAuto:", patchedAddr);

  // 3) Deploy PatchManager
  const PatchManager = await ethers.getContractFactory("PatchManager");
  const manager = await PatchManager.deploy();
  await manager.waitForDeployment();
  const managerAddr = await manager.getAddress();
  console.log("PatchManager:", managerAddr);

  // 4) Save addresses to JSON (for AI orchestrator / later scripts)
  const deployments = {
    network: "localhost",
    deployer: deployer.address,
    contracts: {
      VulnerableContract: vulnAddr,
      PatchedContractAuto: patchedAddr,
      PatchManager: managerAddr
    }
  };

  const outPath = path.join(__dirname, "..", "deployments.local.json");
  fs.writeFileSync(outPath, JSON.stringify(deployments, null, 2));
  console.log(`\nSaved deployment info to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
