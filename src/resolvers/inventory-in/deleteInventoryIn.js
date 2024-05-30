
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import client from "../../db/redis.client.js"
import InventoryIn from "../../models/InventoryIn.js"

async function deleteInventoryIn (__, {id}, context) {
  // VALIDATE ARGS
  const {error} = idSchema.validate(id)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

    let inventoryIn = await InventoryIn.findById(id)

    // NOT FOUND
    if(!inventoryIn) return null

  // VERIFY ACCESS

  const branch = await BranchOffice.findById(inventoryIn.branchId)

  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId
  })

  if (!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 403 }
      }
    })
  }

  await client.del(`inventory-in:${id}`)

  await InventoryIn.findByIdAndDelete(id)

  // RETURN DATA

  return inventoryIn
}
export default deleteInventoryIn