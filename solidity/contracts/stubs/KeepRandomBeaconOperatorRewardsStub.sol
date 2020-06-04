pragma solidity 0.5.17;

import "../KeepRandomBeaconOperator.sol";

contract KeepRandomBeaconOperatorRewardsStub is KeepRandomBeaconOperator {

    constructor(
        address _serviceContract,
        address _stakingContract,
        address _registryContract
    ) KeepRandomBeaconOperator(
        _serviceContract,
        _stakingContract,
        _registryContract
    ) public {
        groups.groupActiveTime = 5;
        groups.relayEntryTimeout = 10;
    }

    function registerNewGroup(bytes memory groupPublicKey, address[] memory members) public {
        groups.addGroup(groupPublicKey);
        groups.setGroupMembers(groupPublicKey, members, hex"");
        emit DkgResultSubmittedEvent(0, groupPublicKey, "");
    }

    function addGroupMemberReward(bytes memory groupPubKey, uint256 groupMemberReward) public {
        groups.addGroupMemberReward(groupPubKey, groupMemberReward);
    }

    function emitRewardsWithdrawnEvent(address operator, uint256 groupIndex) public {
        emit GroupMemberRewardsWithdrawn(stakingContract.beneficiaryOf(operator), operator, 1000 wei, groupIndex);
    }

    function reportUnauthorizedSigning(
        uint256 groupIndex
    ) public {
        // Makes a given group as terminated
        groups.activeTerminatedGroups.push(groupIndex);
        emit UnauthorizedSigningReported(groupIndex);
    }

    function reportRelayEntryTimeout(uint256 groupIndex) public {
        // Makes a given group as terminated
        groups.reportRelayEntryTimeout(groupIndex, groupSize);
        emit RelayEntryTimeoutReported(groupIndex);
    }

}
