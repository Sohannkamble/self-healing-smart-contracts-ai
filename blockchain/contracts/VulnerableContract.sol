// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract VulnerableContract {

    mapping(address => uint256) public balances;

    // Deposit Ether into contract
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    //  Vulnerable withdraw function (Reentrancy possible)
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");

        //  External call before state update
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");

        //  State update after external call (reentrancy flaw)
        balances[msg.sender] -= _amount;
    }

    // Helper function to check contract balance
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}