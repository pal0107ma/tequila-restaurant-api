import { GraphQLError } from "graphql";

async function fillInventoryEntriesOuts ({
  inventoryEntries = [],
  totalProductContent,
  toUpdate = [],
  avoidUpdate
}={}) {

  let fiat = 0

  if(!totalProductContent) return {}
  
  for (let j = 0; j < inventoryEntries.length; j++) {
    const inventoryEntry = inventoryEntries[j];
    
    const used = inventoryEntry.outs.reduce((acc, n)=> acc + n,0)

    const available = (inventoryEntry.totalUnits - used).toFixed(4)

    if(available  >= totalProductContent)  {

      fiat += inventoryEntry.unitCost * totalProductContent

      inventoryEntry.outs.push(totalProductContent)

      toUpdate.push(inventoryEntry)
      
      break
    }

    totalProductContent -= available

    if(totalProductContent && j === inventoryEntries.length -1) {
      throw new GraphQLError('there are not enough in store', {
        extensions: {
          code: 'NOT_IN_STORE',
          http: { status: 409 }
        }
      })
    }

    inventoryEntry.outs.push(available)

    fiat += inventoryEntry.unitCost * available

    toUpdate.push(inventoryEntry)

  }

  if(avoidUpdate)  return {fiat: +fiat.toFixed(4)}

  await  Promise.all(toUpdate.map((item) => item.save()))

  return {fiat: +fiat.toFixed(4)}
}

export default fillInventoryEntriesOuts