import React from "react"
import { Route, Switch, Redirect } from "react-router-dom"
import { NotFound404 } from "./NotFound404"
import { useWeb3Context } from "./WithWeb3Context"
import OperationsPage from "../pages/operations"
import DelegationPage from "../pages/delegation"
import EarningsPage from "../pages/earnings"
import ApplicationsPage from "../pages/applications"
import ResourcesPage from "../pages/ResourcesPage"
import TokenOverviewPage from "../pages/OverviewPage"
import TokenGrantsPage, { TokenGrantPreviewPage } from "../pages/grants"
import RewardsPage from "../pages/rewards"
import LiquidityPage from "../pages/liquidity";
// import CreateTokenGrantPage from "../pages/CreateTokenGrantPage"

const pages = [
  TokenOverviewPage,
  DelegationPage,
  TokenGrantsPage,
  TokenGrantPreviewPage,
  OperationsPage,
  ApplicationsPage,
  EarningsPage,
  RewardsPage,
  LiquidityPage,
  ResourcesPage,
]

class Routing extends React.Component {
  render() {
    return (
      <Switch>
        {/* In case that users will have bookmarked the old link. */}
        <Route exact path="/glossary">
          <Redirect to="/resources/quick-terminology" />
        </Route>
        {/* <Route
          exact
          path="/create-token-grants"
          component={CreateTokenGrantPage}
        /> */}
        {pages.map(renderPage)}
        <Route exact path="/">
          <Redirect to="/overview" />
        </Route>
        <Route path="*">
          <NotFound404 />
        </Route>
      </Switch>
    )
  }
}

export const renderPage = (PageComponent, index) => {
  return (
    <CustomRoute
      key={`${PageComponent.route.path}-${index}`}
      path={PageComponent.route.path}
      exact={PageComponent.route.exact}
      component={PageComponent}
      {...PageComponent.route}
    />
  )
}

const CustomRoute = ({
  path,
  exact,
  component: Component,
  emptyStateComponent: EmptyStateComponent = null,
  withConnectWalletGuard = false,
  ...componentProps
}) => {
  const { yourAddress, provider } = useWeb3Context()

  return (
    <Route path={path} exact={exact}>
      {!withConnectWalletGuard ||
      (withConnectWalletGuard && yourAddress && provider) ? (
        <Component routes={Component.route.pages} {...componentProps} />
      ) : (
        <EmptyStateComponent {...Component.route} />
      )}
    </Route>
  )
}

export default Routing
