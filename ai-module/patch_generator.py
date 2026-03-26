#!/usr/bin/env python3
"""
Simple patch generator for reentrancy vulnerabilities.
Usage:
  python patch_generator.py --type reentrancy --output ../blockchain/contracts/PatchedContract_auto.sol

Generates a safe pattern contract using:
- Checks-Effects-Interactions
- ReentrancyGuard
"""

import argparse
from pathlib import Path
import os

PATCH_REENTRANCY = """// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PatchedContractAuto is ReentrancyGuard {
    mapping(address => uint256) public balances;
    address public owner;

    event Deposit(address indexed who, uint256 amount);
    event Withdraw(address indexed who, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        require(msg.value > 0, "no value");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    // patched withdraw
    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "insufficient");

        // Checks-Effects:
        balances[msg.sender] -= amount;

        // Interactions:
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "transfer failed");

        emit Withdraw(msg.sender, amount);
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
"""

def write_patch(content, out_path):
    p = Path(out_path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    return str(p)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--type", default="reentrancy", help="patch type")
    parser.add_argument("--output", default="output/PatchedContract_auto.sol", help="output path")
    args = parser.parse_args()

    if args.type == "reentrancy":
        out = write_patch(PATCH_REENTRANCY, args.output)
        print(f"Reentrancy patch generated at: {out}")
    else:
        print("Unknown patch type:", args.type)

if __name__ == "__main__":
    main()
