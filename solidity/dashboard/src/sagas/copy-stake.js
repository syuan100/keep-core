import { takeLatest, call, put, delay } from "redux-saga/effects"
import {
  FETCH_DELEGATIONS_FROM_OLD_STAKING_CONTRACT_REQUEST,
  FETCH_DELEGATIONS_FROM_OLD_STAKING_CONTRACT_SUCCESS,
  FETCH_DELEGATIONS_FROM_OLD_STAKING_CONTRACT_FAILURE,
  INCREMENT_STEP,
} from "../actions"
import { fetchOldDelegations } from "../services/staking-port-backer.service"
import { getContractsContext } from "./utils"
import { sendTransaction } from "./web3"
import { CONTRACT_DEPLOY_BLOCK_NUMBER } from "../contracts"
import { showMessage, showCreatedMessage } from "../actions/messages"
import { isEmptyArray } from "../utils/array.utils"
import { messageType } from "../components/Message"

function* fetchOldStakingDelegations() {
  try {
    yield delay(500)
    const { undelegationPeriod, intializationPeriod, delegations } = yield call(
      fetchOldDelegations
    )
    yield put({
      type: FETCH_DELEGATIONS_FROM_OLD_STAKING_CONTRACT_SUCCESS,
      payload: { delegations, undelegationPeriod, intializationPeriod },
    })
  } catch (error) {
    yield put({
      type: FETCH_DELEGATIONS_FROM_OLD_STAKING_CONTRACT_FAILURE,
      payload: error,
    })
  }
}

export function* watchFetchOldStakingContract() {
  yield takeLatest(
    FETCH_DELEGATIONS_FROM_OLD_STAKING_CONTRACT_REQUEST,
    fetchOldStakingDelegations
  )
}

function* copyStake(action) {
  const { operatorAddress, isUndelegating } = action.payload

  try {
    // At first call `copyStake` from `StakingPortBacker` contract.
    yield call(safeCopyStake, operatorAddress)
    // Next call undelegation from old staking contract.
    if (!isUndelegating) {
      yield call(undelegateFromOldContract, action)
    }
    yield put({ type: "copy-stake/copy-stake_success" })
    yield put({ type: INCREMENT_STEP })
  } catch (error) {
    yield put(
      showMessage({
        type: messageType.ERROR,
        title: "Error",
        subtitle: error.message,
        sticky: true,
      })
    )
    yield put({ type: "copy-stake/copy-stake_failure", payload: error })
  }
}

function* safeCopyStake(operator) {
  const { stakingPortBackerContract } = yield getContractsContext()

  const events = yield call(
    [stakingPortBackerContract, stakingPortBackerContract.getPastEvents],
    "StakeCopied",
    {
      fromBlock: CONTRACT_DEPLOY_BLOCK_NUMBER.stakingPortBackerContract,
      filter: { operator },
    }
  )

  if (isEmptyArray(events)) {
    yield call(sendTransaction, {
      payload: {
        contract: stakingPortBackerContract,
        methodName: "copyStake",
        args: [operator],
      },
    })
  } else {
    const txHash = events[0].transactionHash
    yield put(
      showCreatedMessage({
        id: txHash,
        title: "Your delegation has been already copied.",
        content: txHash,
        type: messageType.SUCCESS,
        sticky: true,
        withTransactionHash: true,
      })
    )
  }
}

export function* watchCopyStakeRequest() {
  yield takeLatest("copy-stake/copy-stake_request", copyStake)
}

function* undelegateFromOldContract(action) {
  const delegation = action.payload
  const {
    operatorAddress,
    isFromGrant,
    isManagedGrant,
    managedGrantContractInstance,
  } = delegation

  const { oldTokenStakingContract, grantContract } = yield getContractsContext()
  let contractInstance

  if (isManagedGrant) {
    contractInstance = managedGrantContractInstance
  } else if (isFromGrant) {
    contractInstance = grantContract
  } else {
    contractInstance = oldTokenStakingContract
  }

  yield call(sendTransaction, {
    payload: {
      contract: contractInstance,
      methodName: "undelegate",
      args: [operatorAddress],
    },
  })
}

function* undelegateFromOldContractWorker(action) {
  try {
    yield call(undelegateFromOldContract, action)
    yield put({ type: "copy-stake/undelegation_success" })
    yield put({ type: INCREMENT_STEP })
  } catch (error) {
    yield put({ type: "copy-stake/undelegation_failure", payload: error })
  }
}

function* recoverFromOldStakingContract(action) {
  const delegation = action.payload
  const {
    operatorAddress,
    isFromGrant,
    isManagedGrant,
    managedGrantContractInstance,
  } = delegation

  const { oldTokenStakingContract, grantContract } = yield getContractsContext()
  let contractInstance

  if (isManagedGrant) {
    contractInstance = managedGrantContractInstance
  } else if (isFromGrant) {
    contractInstance = grantContract
  } else {
    contractInstance = oldTokenStakingContract
  }

  try {
    yield call(sendTransaction, {
      payload: {
        contract: contractInstance,
        methodName: "recoverStake",
        args: [operatorAddress],
      },
    })
    yield put({ type: "copy-stake/recover_success" })
    yield put({ type: INCREMENT_STEP })
  } catch (error) {
    yield put({ type: "copy-stake/recover_failure", payload: error })
  }
}

export function* watchUndelegateOldStakeRequest() {
  yield takeLatest(
    "copy-stake/undelegate_request",
    undelegateFromOldContractWorker
  )
}

export function* watchRecovereOldStakeRequest() {
  yield takeLatest("copy-stake/recover_request", recoverFromOldStakingContract)
}
