import React from "react"
import { Rewards } from "../components/Rewards"

const RewardsPage = () => {
  return <Rewards />
}

RewardsPage.route = {
  title: "Keep Random Beacon",
  path: "/earnings/random-beacon",
  exact: true,
}

export default RewardsPage
