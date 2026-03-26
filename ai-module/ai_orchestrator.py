#!/usr/bin/env python3
"""
AI Orchestrator for Self-Healing Smart Contracts

Pipeline:
1. Analyze VulnerableContract.sol with detector.py
2. If reentrancy is detected:
   - Generate PatchedContract_auto.sol via patch_generator.py
   - Run Hardhat compile (force)
   - Run deploy_auto.js (fresh deployment of vuln + AI patch + PatchManager)
   - Run approveAndApply.js (propose + approve + apply patch on-chain)

Usage (from ai-module folder):
  python ai_orchestrator.py

Requirements:
- Hardhat node running in another terminal:
    cd blockchain
    npx hardhat node
"""

import json
import subprocess
import sys
from pathlib import Path

# paths
HERE = Path(__file__).resolve().parent
PROJECT_ROOT = HERE.parent
BLOCKCHAIN_DIR = PROJECT_ROOT / "blockchain"
CONTRACTS_DIR = BLOCKCHAIN_DIR / "contracts"
VULN_CONTRACT = CONTRACTS_DIR / "VulnerableContract.sol"
REPORT_PATH = HERE / "output" / "report.json"


def run_cmd(cmd, cwd=None):
    """Run a shell command and stream output."""
    print(f"\n[orchestrator] Running: {' '.join(cmd)} (cwd={cwd})")
    result = subprocess.run(cmd, cwd=cwd, text=True)
    if result.returncode != 0:
        print(f"[orchestrator] Command failed with code {result.returncode}")
        sys.exit(result.returncode)


def run_detector():
    """Run detector.py on VulnerableContract.sol and load report.json."""
    print("\n[step 1] Running vulnerability detector on VulnerableContract.sol...")

    if not VULN_CONTRACT.exists():
        print(f"[error] {VULN_CONTRACT} not found.")
        sys.exit(1)

    # FIX: use absolute path instead of relative
    run_cmd(
        [
            sys.executable,
            "detector.py",
            str(VULN_CONTRACT),  # 🔥 absolute path here makes detector work
        ],
        cwd=HERE,
    )

    if not REPORT_PATH.exists():
        print("[error] Detector did not produce report.json")
        sys.exit(1)

    report = json.loads(REPORT_PATH.read_text())
    print("\n[orchestrator] Detector report:")
    print(json.dumps(report, indent=2))
    return report


def has_reentrancy(report):
    """Check report for reentrancy-related findings."""
    findings = report.get("findings", [])
    for f in findings:
        if "reentrancy" in f.get("type", "").lower():
            return True
    return False


def generate_patch():
    """Run patch_generator.py to create PatchedContract_auto.sol."""
    print("\n[step 2] Reentrancy detected. Generating AI patch...")
    output_path = CONTRACTS_DIR / "PatchedContract_auto.sol"
    run_cmd(
        [
            sys.executable,
            "patch_generator.py",
            "--type",
            "reentrancy",
            "--output",
            str(output_path),
        ],
        cwd=HERE,
    )
    if not output_path.exists():
        print("[error] Patch file not created.")
        sys.exit(1)
    print(f"[orchestrator] Patch generated at: {output_path}")


def hardhat_compile():
    """Force Hardhat to recompile all contracts."""
    print("\n[step 3] Forcing Hardhat recompile...")
    cmd = "npx hardhat compile --force"
    print(f"[orchestrator] Running: {cmd} (cwd={BLOCKCHAIN_DIR})")

    result = subprocess.run(
        cmd,
        cwd=BLOCKCHAIN_DIR,
        text=True,
        shell=True,
        capture_output=True
    )

    # Show Hardhat output
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr)

    # If compile success message is present, ignore weird exit codes
    if "Compiled " in (result.stdout or "") and "successfully" in (result.stdout or ""):
        print(
            "[orchestrator] Hardhat compile reported success; continuing despite exit code.")
        return

    if result.returncode != 0:
        print(f"[orchestrator] Command failed with code {result.returncode}")
        sys.exit(result.returncode)


def deploy_auto():
    """Fresh deploy vuln + patchedAuto + PatchManager."""
    print("\n[step 4] Deploying VulnerableContract + PatchedContractAuto + PatchManager...")
    cmd = "npx hardhat run scripts/deploy_auto.js --network localhost"
    print(f"[orchestrator] Running: {cmd} (cwd={BLOCKCHAIN_DIR})")
    result = subprocess.run(cmd, cwd=BLOCKCHAIN_DIR, text=True, shell=True)
    if result.returncode != 0:
        print(f"[orchestrator] Command failed with code {result.returncode}")
        sys.exit(result.returncode)


def approve_and_apply():
    """Propose + approve + apply patch."""
    print("\n[step 5] Applying patch...")
    cmd = "npx hardhat run scripts/approveAndApply.js --network localhost"
    print(f"[orchestrator] Running: {cmd} (cwd={BLOCKCHAIN_DIR})")

    result = subprocess.run(
        cmd,
        cwd=BLOCKCHAIN_DIR,
        text=True,
        shell=True,
        capture_output=True
    )

    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr)

    # If our JS script printed success message, ignore weird exit code
    if "Patch Successfully Applied!" in (result.stdout or ""):
        print(
            "[orchestrator] Patch apply reported success; continuing despite exit code.")
        return

    if result.returncode != 0:
        print(f"[orchestrator] Command failed with code {result.returncode}")
        sys.exit(result.returncode)


def main():
    print("=== AI Orchestrator: Self-Healing Smart Contracts ===")

    # Step 1
    report = run_detector()

    # Step 2
    if not has_reentrancy(report):
        print("\n[orchestrator] No reentrancy vulnerability found. Stopping.")
        sys.exit(0)

    # Step 3–5
    generate_patch()
    hardhat_compile()
    deploy_auto()
    approve_and_apply()

    print("\n=== Self-healing cycle completed successfully! 🚀 ===")


if __name__ == "__main__":
    main()
