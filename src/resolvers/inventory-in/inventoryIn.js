
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import client from "../../db/redis.client.js"
import InventoryIn from "../../models/InventoryIn.js"


async function inventoryIn (__, {id}, context) {
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

  // FIND IN REDIS
  let inventoryIn = await client.get(`inventory-in:${id}`)

  // NOT FOUND IN REDIS
  if(!inventoryIn) {

    inventoryIn = await InventoryIn.findById(id).populate({path: 'productId',select:'measureUnit'})

    // NOT FOUND
    if(!inventoryIn) return null

    // STORE IN REDIS
    inventoryIn = JSON.stringify(inventoryIn)

    await client.set(`inventory-in:${id}`, inventoryIn, {
      EX: process.env.INVENTORY_IN_REDIS_EXP
        ? Number(process.env.INVENTORY_IN_REDIS_EXP)
        : 60 * 60 * 24,
      NX: true
    })
  }

  inventoryIn = JSON.parse(inventoryIn)

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

  // RETURN DATA
  
  return inventoryIn
}
export default inventoryIn