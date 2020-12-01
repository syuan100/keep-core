import React from "react"
import { Link, NavLink, useRouteMatch } from "react-router-dom"
import OperationsPage from "../pages/OperatorPage"
import EarningsPage from "../pages/RewardsPageContainer"
import DelegationPage from "../pages/delegation"
import ApplicationsPage from "../pages/ApplicationsPageContainer"
import ResourcesPage from "../pages/ResourcesPage"
import OverviewPage from "../pages/OverviewPage"
import TokenGrantsPage from "../pages/grants"
import RewardsPage from "../pages/rewards"
import * as Icons from "./Icons"
import Divider from "./Divider"
import { isEmptyArray } from "../utils/array.utils"

const styles = {
  overviewDivider: { margin: "1rem 1.5rem" },
}

export const SideMenu = (props) => {
  return (
    <nav className="side-menu--active">
      <ul className="side-menu__list">
        <li className="side-menu__route-wrapper">
          <NavLink
            to={OverviewPage.route.path}
            className="side-menu__route"
            activeClassName="side-menu__route--active"
          >
            {OverviewPage.route.title}
          </NavLink>
          <Divider style={styles.overviewDivider} />
        </li>
        <NavLinkSection
          label="stake"
          icon={<Icons.StakeDrop />}
          subroutes={[DelegationPage.route, TokenGrantsPage.route]}
        />
        <NavLinkSection
          label="work"
          icon={<Icons.SwordOperations />}
          subroutes={[ApplicationsPage.route, OperationsPage.route]}
        />
        <NavLinkSection
          label="earn"
          icon={<Icons.FeesVector />}
          subroutes={[EarningsPage.route, RewardsPage.route]}
        />
        <NavLinkSection
          label="help"
          icon={<Icons.Question />}
          subroutes={[
            // TODO uncomment when `FAQ` page will be implemented
            // { label: "FAQ", path: "/faq", exact: "true" },
            ResourcesPage.route,
          ]}
        />
        {/* TODO: display this link if a user is a keep token contract deployer. This is only used in development mode*/}
        {/* {isKeepTokenContractDeployer && (
          <NavLink exact to="/create-token-grants" label="token grants" />
        )} */}
      </ul>
    </nav>
  )
}

const NavLinkSection = ({ label, icon, subroutes = [] }) => {
  return (
    <li className="side-menu__section">
      <div className="side-menu__section__header">
        <div className="side-menu__section__header__icon">{icon}</div>
        <span className="side-menu__section__header__title">{label}</span>
      </div>
      {!isEmptyArray(subroutes) && (
        <ul className="side-menu__section__routes">
          {subroutes.map(renderRoute)}
        </ul>
      )}
    </li>
  )
}

const renderRoute = (route) => (
  <NavLinkSectionRoute key={route.path} {...route} />
)

const NavLinkSectionRoute = ({ title, path, exact }) => {
  const match = useRouteMatch({
    path,
    exact,
  })

  return (
    <li className="side-menu__route-wrapper">
      <Link to={path} className={`side-menu__route${match ? "--active" : ""}`}>
        {title}
      </Link>
    </li>
  )
}
