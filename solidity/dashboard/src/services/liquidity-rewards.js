import web3Utils from "web3-utils"
import { createERC20Contract, createSaddleSwapContract } from "../contracts"
import BigNumber from "bignumber.js"
import { toTokenUnit } from "../utils/token.utils"
import {
  getPairData,
  getKeepTokenPriceInUSD,
  getBTCPriceInUSD,
} from "./uniswap-api"
import moment from "moment"
import { add } from "../utils/arithmetics.utils"
/** @typedef {import("web3").default} Web3 */
/** @typedef {LiquidityRewards} LiquidityRewards */

// lp contract address -> wrapped ERC20 token as address
const LPRewardsToWrappedTokenCache = {}
const WEEKS_IN_YEAR = 52

class LiquidityRewards {
  constructor(_wrappedTokenContract, _LPRewardsContract, _web3) {
    this.wrappedToken = _wrappedTokenContract
    this.LPRewardsContract = _LPRewardsContract
    this.web3 = _web3
  }

  get wrappedTokenAddress() {
    return this.wrappedToken.options.address
  }

  get LPRewardsContractAddress() {
    return this.LPRewardsContract.options.address
  }

  wrappedTokenBalance = async (address) => {
    return await this.wrappedToken.methods.balanceOf(address).call()
  }

  wrappedTokenTotalSupply = async () => {
    return await this.wrappedToken.methods.totalSupply().call()
  }

  wrappedTokenAllowance = async (owner, spender) => {
    return await this.wrappedToken.methods.allowance(owner, spender).call()
  }

  stakedBalance = async (address) => {
    return await this.LPRewardsContract.methods.balanceOf(address).call()
  }

  totalSupply = async () => {
    return await this.LPRewardsContract.methods.totalSupply().call()
  }

  rewardBalance = async (address) => {
    return await this.LPRewardsContract.methods.earned(address).call()
  }

  rewardRate = async () => {
    return await this.LPRewardsContract.methods.rewardRate().call()
  }

  rewardPoolPerWeek = async () => {
    const rewardRate = await this.rewardRate()
    return toTokenUnit(rewardRate).multipliedBy(
      moment.duration(7, "days").asSeconds()
    )
  }

  _calculateR = (
    keepTokenInUSD,
    rewardPoolPerInterval,
    totalLPTokensInLPRewardsInUSD
  ) => {
    return keepTokenInUSD
      .multipliedBy(rewardPoolPerInterval)
      .div(totalLPTokensInLPRewardsInUSD)
  }

  /**
   * Calculates the APY.
   *
   * @param {BigNumber} r Period rate.
   * @param {number | string | BigNumber} n Number of compounding periods.
   * @return {BigNumber} APY value.
   */
  _calculateAPY = (r, n = WEEKS_IN_YEAR) => {
    return r.plus(1).pow(n).minus(1)
  }

  calculateAPY = async (totalSupplyOfLPRewards) => {
    throw new Error("First, implement the `calculateAPY` function")
  }
}

class UniswapLPRewards extends LiquidityRewards {
  calculateAPY = async (totalSupplyOfLPRewards) => {
    totalSupplyOfLPRewards = toTokenUnit(totalSupplyOfLPRewards)

    const pairData = await getPairData(this.wrappedTokenAddress.toLowerCase())
    const rewardPoolPerWeek = await this.rewardPoolPerWeek()

    const lpRewardsPoolInUSD = totalSupplyOfLPRewards
      .multipliedBy(pairData.reserveUSD)
      .div(pairData.totalSupply)

    const ethPrice = new BigNumber(pairData.reserveUSD).div(pairData.reserveETH)

    let keepTokenInUSD = 0
    if (pairData.token0.symbol === "KEEP") {
      keepTokenInUSD = ethPrice.multipliedBy(pairData.token0.derivedETH)
    } else if (pairData.token1.symbol === "KEEP") {
      keepTokenInUSD = ethPrice.multipliedBy(pairData.token1.derivedETH)
    } else {
      keepTokenInUSD = await getKeepTokenPriceInUSD()
    }

    const r = this._calculateR(
      keepTokenInUSD,
      rewardPoolPerWeek,
      lpRewardsPoolInUSD
    )

    return this._calculateAPY(r, WEEKS_IN_YEAR)
  }
}

class SaddleLPRewards extends LiquidityRewards {
  BTC_POOL_TOKENS = [
    { name: "TBTC", decimals: 18 },
    { name: "WBTC", decimals: 8 },
    { name: "RENBTC", decimals: 8 },
    { name: "SBTC", decimals: 18 },
  ]

  constructor(_wrappedTokenContract, _LPRewardsContract, _web3) {
    super(_wrappedTokenContract, _LPRewardsContract, _web3)
    this.swapContract = createSaddleSwapContract(this.web3)
  }

  swapContract = null

  calculateAPY = async (totalSupplyOfLPRewards) => {
    totalSupplyOfLPRewards = toTokenUnit(totalSupplyOfLPRewards)

    const wrappedTokenTotalSupply = toTokenUnit(
      await this.wrappedTokenTotalSupply()
    )

    const BTCInPool = await this._getBTCInPool()
    const BTCPriceInUSD = await getBTCPriceInUSD()

    const wrappedTokenPoolInUSD = BTCPriceInUSD.multipliedBy(
      toTokenUnit(BTCInPool)
    )

    const keepTokenInUSD = await getKeepTokenPriceInUSD()

    const rewardPoolPerWeek = await this.rewardPoolPerWeek()

    const lpRewardsPoolInUSD = totalSupplyOfLPRewards
      .multipliedBy(wrappedTokenPoolInUSD)
      .div(wrappedTokenTotalSupply)

    const r = this._calculateR(
      keepTokenInUSD,
      rewardPoolPerWeek,
      lpRewardsPoolInUSD
    )

    return this._calculateAPY(r, WEEKS_IN_YEAR)
  }

  _getBTCInPool = async () => {
    return (
      await Promise.all(
        this.BTC_POOL_TOKENS.map(async (token, i) => {
          const balance = await this._getTokenBalance(i)
          return new BigNumber(10)
            .pow(18 - token.decimals) // cast all to 18 decimals
            .multipliedBy(balance)
        })
      )
    ).reduce(add, 0)
  }

  _getTokenBalance = async (index) => {
    return await this.swapContract.methods.getTokenBalance(index).call()
  }
}

const LiquidityRewardsPoolStrategy = {
  UNISWAP: UniswapLPRewards,
  SADDLE: SaddleLPRewards,
}

export class LiquidityRewardsFactory {
  /**
   *
   * @param {('UNISWAP' | 'SADDLE')} pool - The supported type of pools.
   * @param {Object} LPRewardsContract - The LPRewardsContract as web3 contract instance.
   * @param {Web3} web3 - web3
   * @return {LiquidityRewards} - The Liquidity Rewards Wrapper
   */
  static async initialize(pool, LPRewardsContract, web3) {
    const lpRewardsContractAddress = web3Utils.toChecksumAddress(
      LPRewardsContract.options.address
    )

    if (
      !LPRewardsToWrappedTokenCache.hasOwnProperty(lpRewardsContractAddress)
    ) {
      const wrappedTokenAddress = await LPRewardsContract.methods
        .wrappedToken()
        .call()
      LPRewardsToWrappedTokenCache[
        lpRewardsContractAddress
      ] = wrappedTokenAddress
    }

    const wrappedTokenContract = createERC20Contract(
      web3,
      LPRewardsToWrappedTokenCache[lpRewardsContractAddress]
    )

    const PoolStrategy = LiquidityRewardsPoolStrategy[pool]

    return new PoolStrategy(wrappedTokenContract, LPRewardsContract, web3)
  }
}
