import { fork, take, call, put, select } from "redux-saga/effects"
import moment from "moment"
import { createSubcribeToContractEventChannel } from "./web3"
import { getContractsContext, getWeb3Context } from "./utils"
import { createManagedGrantContractInstance } from "../contracts"
import { add, sub } from "../utils/arithmetics.utils"
import { isSameEthAddress } from "../utils/general.utils"
import { getEventsFromTransaction, ZERO_ADDRESS } from "../utils/ethereum.utils"
import { LIQUIDITY_REWARD_PAIRS } from "../constants/constants"
import {
  fetchRewardBalance,
  fetchLPRewardsTotalSupply,
  calculateAPY,
  getWrappedTokenConctract,
} from "../services/liquidity-rewards"

export function* subscribeToKeepTokenTransferEvent() {
  yield take("keep-token/balance_request_success")
  yield fork(observeKeepTokenTransfer)
}

function* observeKeepTokenTransfer() {
  const { token } = yield getContractsContext()
  const {
    eth: { defaultAccount },
  } = yield getWeb3Context()

  // Create subscription channel.
  const contractEventCahnnel = yield call(
    createSubcribeToContractEventChannel,
    token,
    "Transfer"
  )

  // Observe and dispatch an action that updates keep token balance.
  while (true) {
    try {
      const {
        returnValues: { from, to, value },
      } = yield take(contractEventCahnnel)

      let arithmeticOpration
      if (isSameEthAddress(defaultAccount, from)) {
        arithmeticOpration = sub
      } else if (isSameEthAddress(defaultAccount, to)) {
        arithmeticOpration = add
      }
      if (arithmeticOpration) {
        yield put({
          type: "keep-token/transfered",
          payload: { value, arithmeticOpration },
        })
      }
    } catch (error) {
      console.error(`Failed subscribing to Transfer event`, error)
      contractEventCahnnel.close()
    }
  }
}

export function* subscribeToStakedEvent() {
  yield take("staking/fetch_delegations_success")
  yield fork(observeStakedEvents)
}

function* observeStakedEvents() {
  const {
    grantContract,
    tokenStakingEscrow,
    stakingContract,
    stakingPortBackerContract,
  } = yield getContractsContext()
  const web3 = yield getWeb3Context()
  const yourAddress = web3.eth.defaultAccount

  // Other events may also be emitted with the `StakeDelegated` event.
  const eventsToCheck = [
    [stakingContract, "OperatorStaked"],
    [grantContract, "TokenGrantStaked"],
    [tokenStakingEscrow, "DepositRedelegated"],
    [stakingPortBackerContract, "StakeCopied"],
  ]

  // Create subscription channel.
  const contractEventCahnnel = yield call(
    createSubcribeToContractEventChannel,
    stakingContract,
    "StakeDelegated"
  )

  // Observe and dispatch an action that updates staking reducer
  while (true) {
    try {
      const {
        transactionHash,
        returnValues: { owner, operator },
      } = yield take(contractEventCahnnel)

      const { initializationPeriod } = yield select((state) => state.staking)

      const emittedEvents = yield call(
        getEventsFromTransaction,
        eventsToCheck,
        transactionHash
      )

      let isAddressedToCurrentAccount = isSameEthAddress(owner, yourAddress)
      // The `OperatorStaked` is always emitted with the `StakeDelegated` event.
      const { authorizer, beneficiary, value } = emittedEvents.OperatorStaked
      const delegation = {
        createdAt: moment().unix(),
        operatorAddress: operator,
        authorizerAddress: authorizer,
        beneficiary,
        amount: value,
        isInInitializationPeriod: true,
        initializationOverAt: moment
          .unix(moment().unix())
          .add(initializationPeriod, "seconds"),
      }

      if (emittedEvents.StakeCopied) {
        const { owner } = emittedEvents.StakeCopied
        delegation.isCopiedStake = true
        isAddressedToCurrentAccount = isSameEthAddress(owner, yourAddress)

        // Check if the copied delegation is from grant.
        if (isAddressedToCurrentAccount) {
          try {
            const { grantId } = yield call(
              grantContract.methods.getGrantStakeDetails(operator).call
            )

            delegation.isFromGrant = true
            delegation.grantId = grantId
          } catch (error) {
            delegation.isFromGrant = false
          }
        }
      }

      if (
        (emittedEvents.TokenGrantStaked || emittedEvents.DepositRedelegated) &&
        !isAddressedToCurrentAccount
      ) {
        // If the `TokenGrantStaked` or `DepositRedelegated` event exists, it means that a delegation is from grant.
        const { grantId } =
          emittedEvents.TokenGrantStaked || emittedEvents.DepositRedelegated
        delegation.grantId = grantId
        delegation.isFromGrant = true
        const { grantee } = yield call(
          grantContract.methods.getGrant(grantId).call
        )

        isAddressedToCurrentAccount = isSameEthAddress(grantee, yourAddress)

        if (!isAddressedToCurrentAccount) {
          // check if current address is a grantee in the managed grant
          try {
            const managedGrantContractInstance = createManagedGrantContractInstance(
              web3,
              grantee
            )
            const granteeAddressInManagedGrant = yield call(
              managedGrantContractInstance.methods.grantee().call
            )
            delegation.managedGrantContractInstance = managedGrantContractInstance
            delegation.isManagedGrant = true

            // compere a current address with a grantee address from the ManagedGrant contract
            isAddressedToCurrentAccount = isSameEthAddress(
              yourAddress,
              granteeAddressInManagedGrant
            )
          } catch (error) {
            isAddressedToCurrentAccount = false
          }
        }
      }

      if (!isAddressedToCurrentAccount) {
        return
      }

      if (!delegation.isCopiedStake) {
        if (!delegation.isFromGrant) {
          yield put({
            type: "staking/update_owned_delegated_tokens_balance",
            payload: { operation: add, value },
          })
        } else {
          yield put({
            type: "token-grant/grant_staked",
            payload: {
              grantId: delegation.grantId,
              value,
            },
          })
        }
      }

      yield put({ type: "staking/add_delegation", payload: delegation })
    } catch (error) {
      console.error(`Failed subscribing to StakeDelegated event`, error)
      contractEventCahnnel.close()
    }
  }
}

export function* subscribeToUndelegatedEvent() {
  yield take("staking/fetch_delegations_success")
  yield fork(observeUndelegatedEvent)
}

function* observeUndelegatedEvent() {
  const { stakingContract } = yield getContractsContext()

  // Create subscription channel.
  const contractEventCahnnel = yield call(
    createSubcribeToContractEventChannel,
    stakingContract,
    "Undelegated"
  )

  // Observe and dispatch an action that updates keep token balance.
  while (true) {
    try {
      const {
        returnValues: { operator, undelegatedAt },
      } = yield take(contractEventCahnnel)

      // Find the existing delegation by operatorAddress in the app store.
      const delegations = yield select((state) => state.staking.delegations)
      const delegation = delegations.find(({ operatorAddress }) =>
        isSameEthAddress(operatorAddress, operator)
      )

      if (!delegation) {
        return
      }

      // If the delegation exists, we create a undelegation based on the existing delegation.
      const undelegationPeriod = yield select(
        (state) => state.staking.undelegationPeriod
      )
      const undelegation = {
        ...delegation,
        undelegatedAt: moment.unix(undelegatedAt),
        undelegationCompleteAt: moment
          .unix(undelegatedAt)
          .add(undelegationPeriod, "seconds"),
        canRecoverStake: false,
      }

      if (!undelegation.isFromGrant) {
        yield put({
          type: "staking/update_owned_delegated_tokens_balance",
          payload: { operation: sub, value: undelegation.amount },
        })
        yield put({
          type: "staking/update_owned_undelegations_tokens_balance",
          payload: { operation: add, value: undelegation.amount },
        })
      }

      yield put({ type: "staking/remove_delegation", payload: operator })
      yield put({ type: "staking/add_undelegation", payload: undelegation })
    } catch (error) {
      console.error(`Failed subscribing to Undelegated event`, error)
      contractEventCahnnel.close()
    }
  }
}

export function* subscribeToRecoveredStakeEvent() {
  yield take("staking/fetch_delegations_success")
  yield fork(observeRecoveredStakeEvent)
}

function* observeRecoveredStakeEvent() {
  const { stakingContract } = yield getContractsContext()

  // Create subscription channel.
  const contractEventCahnnel = yield call(
    createSubcribeToContractEventChannel,
    stakingContract,
    "RecoveredStake"
  )

  // Observe and dispatch an action that updates keep token balance.
  while (true) {
    try {
      const {
        returnValues: { operator },
      } = yield take(contractEventCahnnel)

      const undelegations = yield select((state) => state.staking.undelegations)
      const recoveredUndelegation = undelegations.find((undelegation) =>
        isSameEthAddress(undelegation.operatorAddress, operator)
      )

      if (!recoveredUndelegation) {
        return
      }

      if (!recoveredUndelegation.isFromGrant) {
        yield put({ type: "staking/remove_undelegation", payload: operator })

        yield put({
          type: "staking/update_owned_undelegations_token_balance",
          payload: { operation: sub, value: recoveredUndelegation.amount },
        })
      }
    } catch (error) {
      console.error(`Failed subscribing to RecoveredStake event`, error)
      contractEventCahnnel.close()
    }
  }
}

export function* subscribeToTokenGrantWithdrawnEvent() {
  yield take("token-grant/fetch_grants_success")
  yield fork(observeTokenGrantWithdrawnEvent)
}

function* observeTokenGrantWithdrawnEvent() {
  const { grantContract } = yield getContractsContext()

  // Create subscription channel.
  const contractEventCahnnel = yield call(
    createSubcribeToContractEventChannel,
    grantContract,
    "TokenGrantWithdrawn"
  )

  // Observe and dispatch an action that updates grants reducer.
  while (true) {
    try {
      const {
        returnValues: { grantId, amount },
      } = yield take(contractEventCahnnel)

      const availableToStake = yield call(
        grantContract.methods.availableToStake(grantId).call
      )
      yield put({
        type: "token-grant/grant_withdrawn",
        payload: { grantId, amount, availableToStake },
      })
    } catch (error) {
      console.error(`Failed subscribing to TokenGrantWithdrawn event`, error)
      contractEventCahnnel.close()
    }
  }
}

export function* subscribeToDepositWithdrawEvent() {
  yield take("token-grant/fetch_grants_success")
  yield fork(observeDepositWithdrawnEvent)
}

function* observeDepositWithdrawnEvent() {
  const { tokenStakingEscrow, grantContract } = yield getContractsContext()
  const {
    eth: { defaultAccount },
  } = yield getWeb3Context()

  // Create subscription channel.
  const contractEventCahnnel = yield call(
    createSubcribeToContractEventChannel,
    tokenStakingEscrow,
    "DepositWithdrawn"
  )

  // Observe and dispatch an action that updates grants reducer.
  while (true) {
    try {
      const {
        returnValues: { grantee, operator, amount },
      } = yield take(contractEventCahnnel)

      // A `grantee` param in the `DepositWithdrawn` event always points to the "right" grantee address.
      // No needed additional check if it's about a managed grant.
      if (!isSameEthAddress(grantee, defaultAccount)) {
        return
      }

      const grantId = yield call(
        tokenStakingEscrow.methods.depositGrantId(operator).call
      )
      const availableToStake = yield call(
        grantContract.methods.availableToStake(grantId).call
      )
      yield put({
        type: "token-grant/grant_withdrawn",
        payload: { grantId, amount, operator, availableToStake },
      })
    } catch (error) {
      console.error(`Failed subscribing to DepositWithdrawn event`, error)
      contractEventCahnnel.close()
    }
  }
}

export function* subscribeToDepositedEvent() {
  yield take("token-grant/fetch_grants_success")
  yield fork(observeDepositedEvent)
}

function* observeDepositedEvent() {
  const { tokenStakingEscrow, grantContract } = yield getContractsContext()

  // Create subscription channel.
  const contractEventCahnnel = yield call(
    createSubcribeToContractEventChannel,
    tokenStakingEscrow,
    "Deposited"
  )

  // Observe and dispatch an action that updates grants reducer.
  while (true) {
    try {
      const {
        returnValues: { operator, grantId, amount },
      } = yield take(contractEventCahnnel)

      const grants = yield select((state) => state.tokenGrants.grants)
      if (grants.find((grant) => grant.id === grantId)) {
        yield put({ type: "staking/remove_delegation", payload: operator })
        yield put({ type: "staking/remove_undelegation", payload: operator })

        const availableToWitdrawGrant = yield call(
          grantContract.methods.withdrawable(grantId).call
        )

        yield put({
          type: "token-grant/grant_deposited",
          payload: {
            grantId,
            availableToWitdrawGrant,
            amount,
            operator,
          },
        })
      }
    } catch (error) {
      console.error(`Failed subscribing to Deposited event`, error)
      contractEventCahnnel.close()
    }
  }
}

export function* subscribeToTopUpInitiatedEvent() {
  yield take("staking/fetch_delegations_success")
  yield fork(observeTopUpInitiatedEvent)
}

function* observeTopUpInitiatedEvent() {
  const {
    stakingContract,
    tokenStakingEscrow,
    grantContract,
  } = yield getContractsContext()

  // Other events may also be emitted with the `TopUpInitiated` event.
  const eventsToCheck = [
    [grantContract, "TokenGrantStaked"],
    [tokenStakingEscrow, "DepositRedelegated"],
  ]

  // Create subscription channel.
  const contractEventCahnnel = yield call(
    createSubcribeToContractEventChannel,
    stakingContract,
    "TopUpInitiated"
  )
  while (true) {
    try {
      const {
        transactionHash,
        returnValues: { operator, topUp },
      } = yield take(contractEventCahnnel)

      const emittedEvents = yield call(
        getEventsFromTransaction,
        eventsToCheck,
        transactionHash
      )

      // Find existing delegation in the app context
      const delegations = yield select((state) => state.staking.delegations)
      const delegation = delegations.find(({ operatorAddress }) =>
        isSameEthAddress(operatorAddress, operator)
      )

      if (delegation) {
        yield put({
          type: "staking/top_up_initiated",
          payload: { operator, topUp },
        })

        if (
          emittedEvents.DepositRedelegated ||
          emittedEvents.TokenGrantStaked
        ) {
          const { grantId, amount } =
            emittedEvents.DepositRedelegated || emittedEvents.TokenGrantStaked
          yield put({
            type: "token-grant/grant_staked",
            payload: { grantId, value: amount },
          })
        }
      }
    } catch (error) {
      console.error(`Failed subscribing to TopUpInitiated event`, error)
      contractEventCahnnel.close()
    }
  }
}

export function* subsribeToTopUpCompletedEvent() {
  yield take("staking/fetch_delegations_success")
  yield fork(observeTopUpCompletedEvent)
}

function* observeTopUpCompletedEvent() {
  const {
    stakingContract,
    tokenStakingEscrow,
    grantContract,
  } = yield getContractsContext()
  const eventsToCheck = [
    [grantContract, "TokenGrantStaked"],
    [tokenStakingEscrow, "DepositRedelegated"],
  ]

  // Create subscription channel.
  const contractEventCahnnel = yield call(
    createSubcribeToContractEventChannel,
    stakingContract,
    "TopUpCompleted"
  )

  while (true) {
    try {
      const {
        transactionHash,
        returnValues: { operator, newAmount },
      } = yield take(contractEventCahnnel)

      const emittedEvents = yield call(
        getEventsFromTransaction,
        eventsToCheck,
        transactionHash
      )

      yield put({
        type: "staking/top_up_completed",
        payload: { operator, newAmount },
      })
      if (emittedEvents.DepositRedelegated || emittedEvents.TokenGrantStaked) {
        const { grantId, amount } =
          emittedEvents.DepositRedelegated || emittedEvents.TokenGrantStaked
        yield put({
          type: "token-grant/grant_satked",
          payload: { grantId, value: amount },
        })
      }
    } catch (error) {
      console.error(`Failed subscribing to TopUpCompleted event`, error)
      contractEventCahnnel.close()
    }
  }
}

function* observeECDSARewardsClaimedEvent(data) {
  const { ECDSARewardsDistributorContract } = yield getContractsContext()

  // Create subscription channel.
  const contractEventCahnnel = yield call(
    createSubcribeToContractEventChannel,
    ECDSARewardsDistributorContract,
    "RewardsClaimed"
  )

  while (true) {
    try {
      const {
        returnValues: { merkleRoot, index, operator, amount },
      } = yield take(contractEventCahnnel)

      yield put({
        type: "rewards/ecdsa_withdrawn",
        payload: { merkleRoot, index, operator, amount },
      })
    } catch (error) {
      console.error(`Failed subscribing to RewardsClaimed event`, error)
      contractEventCahnnel.close()
    }
  }
}

export function* subsribeToECDSARewardsClaimedEvent() {
  yield take("rewards/ecdsa_fetch_rewards_data_success")
  yield fork(observeECDSARewardsClaimedEvent)
}

function* observeLiquidityTokenStakedEvent(liquidityRewardPair) {
  const contracts = yield getContractsContext()
  const LPRewardsContract = contracts[liquidityRewardPair.contractName]

  // Create subscription channel.
  const contractEventCahnnel = yield call(
    createSubcribeToContractEventChannel,
    LPRewardsContract,
    "Staked"
  )

  while (true) {
    try {
      const eventData = yield take(contractEventCahnnel)

      yield* lpTokensStakedOrWithdrawn(
        eventData.returnValues,
        liquidityRewardPair.name,
        LPRewardsContract,
        `liquidity_rewards/${liquidityRewardPair.name}_staked`
      )
    } catch (error) {
      console.error(`Failed subscribing to Staked event`, error)
      contractEventCahnnel.close()
    }
  }
}

function* observeLiquidityTokenWithdrawnEvent(liquidityRewardPair) {
  const contracts = yield getContractsContext()
  const LPRewardsContract = contracts[liquidityRewardPair.contractName]

  // Create subscription channel.
  const contractEventCahnnel = yield call(
    createSubcribeToContractEventChannel,
    LPRewardsContract,
    "Withdrawn"
  )

  while (true) {
    try {
      const eventData = yield take(contractEventCahnnel)
      yield* lpTokensStakedOrWithdrawn(
        eventData.returnValues,
        liquidityRewardPair.name,
        LPRewardsContract,
        `liquidity_rewards/${liquidityRewardPair.name}_withdrawn`
      )
    } catch (error) {
      console.error(`Failed subscribing to Withdrawn event`, error)
      contractEventCahnnel.close()
    }
  }
}

function* lpTokensStakedOrWithdrawn(
  eventValues,
  liquidityRewardPairName,
  LPRewardsContract,
  actionType
) {
  const {
    eth: { defaultAccount },
  } = yield getWeb3Context()

  const { user, amount } = eventValues
  const totalSupply = yield call(fetchLPRewardsTotalSupply, LPRewardsContract)

  const apy = yield call(calculateAPY, totalSupply, liquidityRewardPairName)

  const reward = yield call(
    fetchRewardBalance,
    defaultAccount,
    LPRewardsContract
  )

  // If the `Withdrawn` or `Staked` event was emitted the total pool of the LPRewards,
  // APY and reward value have changed.
  yield put({
    type: actionType,
    payload: {
      // Update only if this transacion relates to the current logged account.
      amount: isSameEthAddress(defaultAccount, user) ? amount : 0,
      totalSupply,
      reward,
      apy,
      liquidityRewardPairName,
    },
  })
}

function* observeLiquidityRewardPaidEvent(liquidityRewardPair) {
  const contracts = yield getContractsContext()
  const {
    eth: { defaultAccount },
  } = yield getWeb3Context()
  const LPRewardsContract = contracts[liquidityRewardPair.contractName]

  // Create subscription channel.
  const contractEventCahnnel = yield call(
    createSubcribeToContractEventChannel,
    LPRewardsContract,
    "RewardPaid"
  )

  while (true) {
    try {
      const {
        returnValues: { user, reward },
      } = yield take(contractEventCahnnel)

      if (isSameEthAddress(defaultAccount, user)) {
        yield put({
          type: `liquidity_rewards/${liquidityRewardPair.name}_reward_paid`,
          payload: {
            reward,
            liquidityRewardPairName: liquidityRewardPair.name,
          },
        })
      }
    } catch (error) {
      console.error(`Failed subscribing to RewardPaid event`, error)
      contractEventCahnnel.close()
    }
  }
}

function* observeWrappedTokenMintAndBurnTx(liquidityRewardPair) {
  const contracts = yield getContractsContext()
  const LPRewardsContract = contracts[liquidityRewardPair.contractName]
  const WrappedTokenContract = yield call(
    getWrappedTokenConctract,
    LPRewardsContract
  )

  const contractEventCahnnel = yield call(
    createSubcribeToContractEventChannel,
    WrappedTokenContract,
    "Transfer"
  )

  while (true) {
    try {
      const {
        returnValues: { from, to },
      } = yield take(contractEventCahnnel)

      // If the `from` is a zero address it means it was a `mint` transaction.
      // If the `to` is a zero address it means it was a `burn` transaction. For
      // these casese we need to update APY value because the tootal pool value
      // of the wrapped token has been increased / decresed.
      if (from === ZERO_ADDRESS || to === ZERO_ADDRESS) {
        yield* updateAPY()
      }
    } catch (error) {
      console.error(`Failed subscribing to Transfer event`, error)
      contractEventCahnnel.close()
    }
  }
}

function* updateAPY(LPRewardsContract, liquidityRewardPairName) {
  const totalSupply = yield call(fetchLPRewardsTotalSupply, LPRewardsContract)

  const apy = yield call(calculateAPY, totalSupply, liquidityRewardPairName)
  yield put({
    type: `liquidity_rewards/${liquidityRewardPairName}_apy_updated`,
    payload: {
      apy,
      liquidityRewardPairName,
    },
  })
}

export function* subscribeToLiquidityRewardsEvents() {
  for (const [pairName, value] of Object.entries(LIQUIDITY_REWARD_PAIRS)) {
    yield fork(
      function* (liquidityRewardPair) {
        yield take(
          `liquidity_rewards/${liquidityRewardPair.name}_fetch_data_success`
        )
        yield fork(observeLiquidityTokenStakedEvent, liquidityRewardPair)
        yield fork(observeLiquidityTokenWithdrawnEvent, liquidityRewardPair)
        yield fork(observeLiquidityRewardPaidEvent, liquidityRewardPair)
        yield fork(observeWrappedTokenMintAndBurnTx, liquidityRewardPair)
      },
      {
        name: pairName,
        ...value,
      }
    )
  }
}
