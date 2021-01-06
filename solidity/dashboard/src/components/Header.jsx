import React from "react"
import { NavLink } from "react-router-dom"
import { isEmptyArray } from "../utils/array.utils"
import { Web3Status } from "./Web3Status"
import Chip from "./Chip"

const Header = ({ title, subLinks, className = "", newPage = false }) => {
  console.log(newPage)
  return (
    <header className={`header ${className}`}>
      <div className="header__content">
        <h1 className="header__title">
          {title}{" "}
          {newPage && <Chip text="NEW" className={"header__chip ml-1"} />}
        </h1>
        <Web3Status />
      </div>
      {!isEmptyArray(subLinks) && (
        <nav className="header__sub-nav">
          <ul className="sub-nav__list">{subLinks.map(renderSubNavItem)}</ul>
        </nav>
      )}
    </header>
  )
}

const SubNavItem = ({ title, path }) => {
  return (
    <li className="sub-nav__item-wrapper">
      <NavLink
        to={path}
        className="sub-nav__item"
        activeClassName="sub-nav__item--active"
        exact={true}
      >
        {title}
      </NavLink>
    </li>
  )
}

const renderSubNavItem = (item, index) => (
  <SubNavItem key={`${index}-${item.path}`} {...item} />
)

export default Header
