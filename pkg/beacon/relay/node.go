package relay

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"math/big"
	"sync"

	relaychain "github.com/keep-network/keep-core/pkg/beacon/relay/chain"
	"github.com/keep-network/keep-core/pkg/beacon/relay/config"
	"github.com/keep-network/keep-core/pkg/beacon/relay/dkg"
	"github.com/keep-network/keep-core/pkg/beacon/relay/groupselection"
	"github.com/keep-network/keep-core/pkg/beacon/relay/registry"
	"github.com/keep-network/keep-core/pkg/chain"
	"github.com/keep-network/keep-core/pkg/net"
)

// Node represents the current state of a relay node.
type Node struct {
	mutex sync.Mutex

	// Staker is an on-chain identity that this node is using to prove its
	// stake in the system.
	Staker chain.Staker

	// External interactors.
	netProvider  net.Provider
	blockCounter chain.BlockCounter
	chainConfig  *config.Chain

	// The IDs of the known stakes in the system, including this node's StakeID.
	stakeIDs      []string
	maxStakeIndex int

	groupRegistry *registry.Groups
}

// JoinGroupIfEligible takes a threshold relay entry value and undergoes the
// process of joining a group if this node's virtual stakers prove eligible for
// the group generated by that entry. This is an interactive on-chain process,
// and JoinGroupIfEligible can block for an extended period of time while it
// completes the on-chain operation.
//
// Indirectly, the completion of the process is signaled by the formation of an
// on-chain group containing at least one of this node's virtual stakers.
func (n *Node) JoinGroupIfEligible(
	relayChain relaychain.Interface,
	groupSelectionResult *groupselection.Result,
	entrySeed *big.Int,
	dkgStartBlockHeight uint64,
) {

	for index, selectedStaker := range groupSelectionResult.SelectedStakers {
		// If we are amongst those chosen, kick off an instance of DKG. We may
		// have been selected multiple times (which would result in multiple
		// instances of DKG).
		if bytes.Compare(selectedStaker, n.Staker.ID()) == 0 {
			// capture player index for goroutine
			playerIndex := index

			// build the channel name and get the broadcast channel
			broadcastChannelName := channelNameForGroup(groupSelectionResult)

			// We should only join the broadcast channel if we're
			// elligible for the group
			broadcastChannel, err := n.netProvider.ChannelFor(
				broadcastChannelName,
			)
			if err != nil {
				logger.Errorf(
					"Failed to get broadcastChannel for name %s with err: [%v].",
					broadcastChannelName,
					err,
				)
				return
			}

			go func() {
				signer, err := dkg.ExecuteDKG(
					entrySeed,
					playerIndex,
					n.chainConfig.GroupSize,
					n.chainConfig.Threshold,
					dkgStartBlockHeight,
					n.blockCounter,
					relayChain,
					broadcastChannel,
				)
				if err != nil {
					logger.Errorf("Failed to execute dkg: [%v].", err)
					return
				}

				err = n.groupRegistry.RegisterGroup(
					signer,
					broadcastChannelName,
				)
				if err != nil {
					logger.Errorf("Failed to register a group: [%v].", err)
				}
			}()
		}
	}

	return
}

// channelNameForGroup takes the selected stakers, and does the
// following to construct the broadcastChannel name:
// * concatenates all of the staker values
// * returns the hashed concatenated values in hexadecimal representation
func channelNameForGroup(group *groupselection.Result) string {
	var channelNameBytes []byte
	for _, staker := range group.SelectedStakers {
		channelNameBytes = append(channelNameBytes, staker...)
	}
	hexChannelName := hex.EncodeToString(
		groupselection.SHAValue(sha256.Sum256(channelNameBytes)).Bytes(),
	)

	return hexChannelName
}
