import React, { useEffect, useState } from 'react'
import TokenGrantOverview from './TokenGrantOverview'
import Dropdown from './Dropdown'
import SelectedGrantDropdown from './SelectedGrantDropdown'
import { useFetchData } from '../hooks/useFetchData'
import { useSubscribeToContractEvent } from '../hooks/useSubscribeToContractEvent'
import { tokenGrantsService } from '../services/token-grants.service'
import { displayAmount, isEmptyObj } from '../utils'
import { TOKEN_GRANT_CONTRACT_NAME } from '../constants/constants'
import { add, sub, gte } from '../utils/arithmetics.utils'

const TokenGrantsOverview = ({ grantBalance }) => {
  const [state, updateData] = useFetchData(tokenGrantsService.fetchGrants, [])
  const { data } = state
  const [selectedGrant, setSelectedGrant] = useState({})
  const { latestEvent: stakedEvent } = useSubscribeToContractEvent(TOKEN_GRANT_CONTRACT_NAME, 'TokenGrantStaked')
  const { latestEvent: withdrawanEvent } = useSubscribeToContractEvent(TOKEN_GRANT_CONTRACT_NAME, 'TokenGrantWithdrawn')

  useEffect(() => {
    if (selectedGrant && data.length > 0) {
      setSelectedGrant(data[0])
    }
  }, [data])

  const onSelect = (selectedItem) => {
    setSelectedGrant(selectedItem)
  }

  useEffect(() => {
    if (isEmptyObj(stakedEvent)) {
      return
    }
    const { returnValues: { grantId, amount } } = stakedEvent
    let indexInArray = null
    let grantToUpdate = null
    for (let index = 0; index < data.length; index++) {
      const grant = data[index]
      if (grant.id === grantId) {
        grantToUpdate = grant
        indexInArray = index
        break
      }
    }
    if (indexInArray === null) {
      return
    }
    grantToUpdate.staked = add(grantToUpdate.staked, amount)
    grantToUpdate.readyToRelease = sub(grantToUpdate.readyToRelease, amount)
    grantToUpdate.readyToRelease = gte(grantToUpdate.readyToRelease, 0) ? grantToUpdate.readyToRelease : '0'
    const updatedGrants = [...data]
    updatedGrants[indexInArray] = grantToUpdate
    updateData(updatedGrants)
    if (grantId === selectedGrant.id) {
      setSelectedGrant(grantToUpdate)
    }
  }, [stakedEvent.transactionHash, selectedGrant])

  useEffect(() => {
    if (isEmptyObj(withdrawanEvent)) {
      return
    }
    const { returnValues: { grantId, amount } } = withdrawanEvent
    let indexInArray = null
    let grantToUpdate = null
    for (let index = 0; index < data.length; index++) {
      const grant = data[index]
      if (grant.id === grantId) {
        grantToUpdate = grant
        indexInArray = index
        break
      }
    }
    if (indexInArray === null) {
      return
    }

    grantToUpdate.readyToRelease = '0'
    grantToUpdate.released = add(grantToUpdate.released, amount)
    grantToUpdate.vested = add(grantToUpdate.released, grantToUpdate.staked)
    const updatedGrants = [...data]
    updatedGrants[indexInArray] = grantToUpdate
    updateData(updatedGrants)
    if (grantId === selectedGrant.id) {
      console.log('in if setSelectedGrant', withdrawanEvent)
      setSelectedGrant(grantToUpdate)
    }
  }, [withdrawanEvent.transactionHash, selectedGrant])

  return (
    <section>
      <h4 className="text-grey-60">Granted Tokens</h4>
      <h2 className="balance">{displayAmount(grantBalance)}</h2>
      <div style={data.length === 0 ? { display: 'none' } : {}}>
        {
          data.length > 1 &&
              <Dropdown
                onSelect={onSelect}
                options={data}
                valuePropertyName='id'
                labelPropertyName='id'
                selectedItem={selectedGrant}
                labelPrefix='Grant ID'
                noItemSelectedText='Select Grant'
                label="Choose Grant"
                selectedItemComponent={<SelectedGrantDropdown grant={selectedGrant} />}
              />
        }
        <TokenGrantOverview selectedGrant={selectedGrant} />
      </div>
    </section>
  )
}

export default React.memo(TokenGrantsOverview)
