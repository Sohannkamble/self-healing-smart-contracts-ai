// SPDX-License-Identifier: MIT
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
