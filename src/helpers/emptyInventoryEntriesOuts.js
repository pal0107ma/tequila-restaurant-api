

async function emptyInventoryEntriesOuts ({
  inventoryEntries = [],
  totalProductContent,
  toUpdate = [],
  avoidUpdate 
}={}) {

  let fiat = 0

  for (let j = 0; j < inventoryEntries.length; j++) {
    const inventoryEntry = inventoryEntries[j];

    const used = inventoryEntry.outs.reduce((acc, n)=> acc + n,0)

    if(used  >= totalProductContent) {

      fiat += inventoryEntry.unitCost * totalProductContent

      inventoryEntry.outs = [used - totalProductContent]

      toUpdate.push(inventoryEntry)
      
      break
    }

    totalProductContent -= used

    inventoryEntry.outs = []

    toUpdate.push(inventoryEntry)

    fiat += inventoryEntry.unitCost * used
  }


  if(avoidUpdate)  return {fiat: +fiat.toFixed(4)}

  await  Promise.all(toUpdate.map((item) => item.save()))

  return {fiat: +fiat.toFixed(4)}

}

export default emptyInventoryEntriesOuts