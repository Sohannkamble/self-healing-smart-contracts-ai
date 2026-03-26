// scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // VulnerableContract
  const Vulnerable = await ethers.getContractFactory("VulnerableContract");
  const vuln = await Vulnerable.deploy();
  await vuln.waitForDeployment();                // ethers v6 compatible
  console.log("VulnerableContract:", vuln.target); // vuln.target is the deployed address

  // PatchedContract
  const Patched = await ethers.getContractFactory("PatchedContract");
  const patched = await Patched.deploy();
  await patched.waitForDeployment();
  console.log("PatchedContract:", patched.target);

  // PatchManager
  const PatchManager = await ethers.getContractFactory("PatchManager");
  const manager = await PatchManager.deploy();
  await manager.waitForDeployment();
  console.log("PatchManager:", manager.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
