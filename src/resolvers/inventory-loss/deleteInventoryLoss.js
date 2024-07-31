
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import InventoryEntry from "../../models/InventoryEntry.js"
import InventoryLoss from "../../models/InventoryLoss.js"
import emptyInventoryEntriesOuts from "../../helpers/emptyInventoryEntriesOuts.js"

async function deleteInventoryLoss (__,{id}, context) {

   const { error } = idSchema.validate(id)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  const inventoryLoss = await InventoryLoss.findById(id)

  if(!inventoryLoss) return null

  const branch = await BranchOffice.findById(inventoryLoss.branchId)

  const restaurant = await Restaurant.findOne({
    _id: branch.restaurantId,
    userId: context.user._id
  })

  if (!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'PRODUCT_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  } 

  const inventoryEntries = await InventoryEntry
  .find({productId: inventoryLoss.productId, $where: `return this.outs.reduce((acc,n)=> acc + n,0) === this.totalUnits`,})
  .sort({createdAt: -1})
  .limit(50)
    
  const inventoryEntry = await InventoryEntry.findOne({
    $where: `return this.outs.length && this.outs.reduce((acc,n)=> acc + n,0) < this.totalUnits`,
    productId: inventoryLoss.productId
  })
  
  if(inventoryEntry) inventoryEntries.unshift(inventoryEntry)

  await emptyInventoryEntriesOuts({inventoryEntries, totalProductContent: inventoryLoss.quantity})

  await InventoryLoss.findByIdAndDelete(id)

  return JSON.parse(JSON.stringify(inventoryLoss))
}

export default deleteInventoryLoss