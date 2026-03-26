// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PatchManager is Ownable {
    enum Status { Proposed, Approved, Applied, Rejected }

    struct Patch {
        uint256 id;
        address proposer;
        address targetContract;
        address patchedContract;
        string ipfsHash;
        string description;
        Status status;
        uint256 timestamp;
    }

    uint256 public nextId;
    mapping(uint256 => Patch) public patches;

    event PatchProposed(
        uint256 indexed id,
        address indexed proposer,
        address indexed target,
        string ipfsHash
    );
    event PatchApproved(uint256 indexed id, address approver);
    event PatchApplied(uint256 indexed id, address patchedContract);
    event PatchRejected(uint256 indexed id, address rejectedBy);

    function proposePatch(
        address targetContract,
        address patchedContract,
        string calldata ipfsHash,
        string calldata description
    ) external returns (uint256) {
        uint256 id = nextId++;

        patches[id] = Patch({
            id: id,
            proposer: msg.sender,
            targetContract: targetContract,
            patchedContract: patchedContract,
            ipfsHash: ipfsHash,
            description: description,
            status: Status.Proposed,
            timestamp: block.timestamp
        });

        emit PatchProposed(id, msg.sender, targetContract, ipfsHash);
        return id;
    }

    function approvePatch(uint256 id) external onlyOwner {
        require(patches[id].status == Status.Proposed, "Not in proposed state");
        patches[id].status = Status.Approved;
        emit PatchApproved(id, msg.sender);
    }

    function applyPatch(uint256 id) external onlyOwner {
        require(patches[id].status == Status.Approved, "Not approved");
        patches[id].status = Status.Applied;
        emit PatchApplied(id, patches[id].patchedContract);
    }

    function rejectPatch(uint256 id) external onlyOwner {
        require(
            patches[id].status == Status.Proposed ||
            patches[id].status == Status.Approved,
            "Not allowed"
        );
        patches[id].status = Status.Rejected;
        emit PatchRejected(id, msg.sender);
    }

    // Getter to return a Patch
    function getPatch(uint256 pid) external view returns (Patch memory) {
        return patches[pid];
    }
}
