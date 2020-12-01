import React, { useEffect, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import TokenAmount from "../../components/TokenAmount"
import { SubmitButton } from "../../components/Button"
import {
  BeaconRewardsDetails,
  ECDSARewardsDetails,
} from "../../components/RewardsDetails"
// import StakeDropChart from "../../components/StakeDropChart"
import { useWeb3Context } from "../../components/WithWeb3Context"
import { TokenAmountSkeleton } from "../../components/skeletons"
import EmptyStatePage from "./EmptyStatePage"
import { gt } from "../../utils/arithmetics.utils"

const RewardsOverviewPage = () => {
  const dispatch = useDispatch()
  const { yourAddress } = useWeb3Context()
  const {
    beaconRewardsFetching,
    becaonRewardsBalance,
    ecdsaDistributedBalance,
    ecdsaAvailableRewardsFetching,
    ecdsaAvailableRewardsBalance,
    ecdsaAvailableRewards,
  } = useSelector((state) => state.rewards)

  useEffect(() => {
    dispatch({
      type: "rewards/beacon_fetch_distributed_rewards_request",
      payload: yourAddress,
    })
    dispatch({
      type: "rewards/ecdsa_fetch_distributed_rewards_request",
      payload: yourAddress,
    })
    dispatch({
      type: "rewards/ecdsa_fetch_available_rewards_request",
      payload: yourAddress,
    })
  }, [dispatch, yourAddress])

  const onWithdrawECDSARewards = useCallback(
    (awaitingPromise) => {
      dispatch({
        type: "rewards/ecdsa_withdraw",
        payload: ecdsaAvailableRewards,
        meta: awaitingPromise,
      })
    },
    [dispatch, ecdsaAvailableRewards]
  )

  return (
    <>
      <section className="rewards-overview--random-beacon">
        <section>
          <Balance
            title="Random Beacon Rewards"
            rewardsBalance={becaonRewardsBalance}
            isBalanceFetching={beaconRewardsFetching}
          />
        </section>
        <section>
          <BeaconRewardsDetails />
        </section>
        {/* For now, we decided to drop out the `StakeDropChart`
            to keep consistency on the rewards overview page.
        */}
        {/* <section className="tile">
          <StakeDropChart />
        </section> */}
      </section>

      <section className="rewards-overview--ecdsa">
        <section>
          <Balance
            title="tBTC Rewards"
            rewardsBalance={ecdsaAvailableRewardsBalance}
            isBalanceFetching={ecdsaAvailableRewardsFetching}
            onWithdrawAll={onWithdrawECDSARewards}
          />
        </section>
        <section>
          <ECDSARewardsDetails pastRewards={ecdsaDistributedBalance} />
        </section>
      </section>
    </>
  )
}

const Balance = ({
  title,
  rewardsBalance,
  isBalanceFetching,
  onWithdrawAll,
}) => {
  return (
    <>
      <h2 className="h2--alt mb-1">{title}</h2>
      {isBalanceFetching ? (
        <TokenAmountSkeleton />
      ) : (
        <TokenAmount amount={rewardsBalance} currencySymbol="KEEP" />
      )}
      {onWithdrawAll && (
        <SubmitButton
          onSubmitAction={onWithdrawAll}
          className="btn btn-primary btn-lg mt-2"
          disabled={!gt(rewardsBalance, 0)}
        >
          withdraw all
        </SubmitButton>
      )}
    </>
  )
}

RewardsOverviewPage.route = {
  title: "Overview",
  path: "/rewards/overview",
  exact: true,
  withConnectWalletGuard: true,
  emptyStateComponent: EmptyStatePage,
}

export default RewardsOverviewPage
