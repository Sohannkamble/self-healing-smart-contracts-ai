// scripts/proposePatch.js
// Usage with Hardhat network (local):
// npx hardhat run scripts/proposePatch.js --network localhost --target <vulnAddr> --patched <patchedAddr> --manager <patchMgrAddr>

const hre = require("hardhat");

async function main() {
  const args = require('minimist')(process.argv.slice(2));
  const target = args.target || args.t;
  const patched = args.patched || args.p;
  const managerAddr = args.manager || args.m;
  const ipfs = args.ipfs || "QmFakeHash";
  const desc = args.desc || "AI suggested patch: reentrancy fix";

  if (!target || !patched || !managerAddr) {
    console.error("Missing args. Usage: npx hardhat run scripts/proposePatch.js --network localhost --target <vulnAddr> --patched <patchedAddr> --manager <managerAddr>");
    process.exit(1);
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("Proposing patch with signer:", deployer.address);

  const manager = await hre.ethers.getContractAt("PatchManager", managerAddr, deployer);
  const tx = await manager.proposePatch(target, patched, ipfs, desc);
  const receipt = await tx.wait();
  console.log("Patch proposed. Tx:", receipt.transactionHash);
  const id = 0; // for prototype the first patch ID is 0; alternatively parse event to get actual id
  console.log("Done. (Prototype assumes patch id 0)");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
