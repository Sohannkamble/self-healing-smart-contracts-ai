#!/usr/bin/env python3
"""
Simple rule-based Solidity vulnerability detector.
Usage:
  python detector.py ../blockchain/contracts/VulnerableContract.sol
Outputs:
  - JSON report printed to stdout
  - file ./output/report.json
"""

import re
import sys
import json
import os
from pathlib import Path

# simple rule-based vulnerability indicators
RULES = [
    ("reentrancy_possible", ["call{", ".call(", ".delegatecall(", "call.value("]),
    ("missing_nonReentrant", ["nonReentrant", "ReentrancyGuard"]),
    ("state_update_after_call", ["-="]),
    ("unchecked_send", ["send(", "transfer("]),
    ("arithmetic_ops", ["++", "--"]),
]

def read_file(path):
    return Path(path).read_text(encoding="utf-8")

def detect(code):
    findings = []
    lower = code

    # apply simple rules
    for name, tokens in RULES:
        for t in tokens:
            if t in lower:
                findings.append({
                    "type": name,
                    "evidence": t
                })
                break

    # detect call-before-state-update (reentrancy pattern)
    fn_blocks = re.findall(
        r"function\s+[^\(]+\([^\)]*\)[^{]*\{([^}]*)\}",
        code,
        flags=re.S
    )

    for block in fn_blocks:
        call_pos = min([
            block.find(x) for x in [".call", "call.value", ".delegatecall"] 
            if x in block
        ], default=-1)
        state_pos = block.find("-=")

        if call_pos != -1 and state_pos != -1 and call_pos < state_pos:
            findings.append({
                "type": "reentrancy_order_issue",
                "evidence": block.strip()[:150]
            })

    # dedupe
    unique = {f["type"]: f for f in findings}
    return list(unique.values())

def save_report(report, out_dir="output"):
    os.makedirs(out_dir, exist_ok=True)
    out_path = Path(out_dir) / "report.json"
    out_path.write_text(json.dumps(report, indent=2))
    return str(out_path)

def main():
    if len(sys.argv) < 2:
        print("Usage: python detector.py <file.sol>")
        sys.exit(1)

    sol_path = sys.argv[1]
    code = read_file(sol_path)

    findings = detect(code)

    report = {
        "file": os.path.basename(sol_path),
        "path": sol_path,
        "findings": findings
    }

    save_path = save_report(report)
    print(json.dumps(report, indent=2))
    print(f"\nReport saved to {save_path}")

if __name__ == "__main__":
    main()
