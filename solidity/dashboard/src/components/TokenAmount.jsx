import React from "react"
import * as Icons from "./Icons"
import { displayAmount, getNumberWithMetricSuffix } from "../utils/token.utils"
import Tooltip from "./Tooltip"

const TokenAmount = ({
  wrapperClassName,
  currencyIcon,
  currencyIconProps,
  amount,
  amountClassName,
  suffixClassName,
  displayWithMetricSuffix,
  currencySymbol,
  displayAmountFunction,
  withTooltip,
  tooltipText,
}) => {
  const { value, suffix } = displayWithMetricSuffix
    ? getNumberWithMetricSuffix(displayAmountFunction(amount, false))
    : { value: "0", suffix: "" }
  const CurrencyIcon = currencyIcon

  const TokenAmount = () => (
    <div className={`token-amount flex row center ${wrapperClassName || ""}`}>
      <CurrencyIcon {...currencyIconProps} />
      <span className={amountClassName} style={{ marginLeft: "10px" }}>
        {displayWithMetricSuffix ? value : displayAmountFunction(amount)}
        {displayWithMetricSuffix && (
          <span
            className={suffixClassName}
            style={{ marginLeft: "3px", alignSelf: "flex-end" }}
          >
            {suffix}
          </span>
        )}
        {currencySymbol && <span>&nbsp;{currencySymbol}</span>}
      </span>
    </div>
  )

  return withTooltip ? (
    <Tooltip
      simple
      triggerComponent={TokenAmount}
      className="token-amount-tooltip"
    >
      {tooltipText}
    </Tooltip>
  ) : (
    <TokenAmount />
  )
}

TokenAmount.defaultProps = {
  currencyIcon: Icons.KeepOutline,
  currencyIconProps: {},
  amountClassName: "h1 text-primary",
  suffixClassName: "h3",
  displayWithMetricSuffix: true,
  wrapperClassName: "",
  currencySymbol: null,
  displayAmountFunction: displayAmount,
}

export default TokenAmount
