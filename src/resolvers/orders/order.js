import idSchema from "../../schemas/idSchema.js"; // Import the ID validation schema
import { GraphQLError } from "graphql";
import BranchOffice from "../../models/BranchOffice.js";
import Restaurant from "../../models/Restaurant.js";
import Order from "../../models/Order.js";
import client from "../../db/redis.client.js";

async function order(__,{id},context) {

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

  let order = await client.get(`orders:${id}`)

  if(!order) {
    order = await Order.findById(id)

    if(!order) return null

    order = JSON.stringify(order)

    await client.set(`orders:${id}`, order, {
      EX: process.env.PRODUCT_REDIS_EXP
        ? Number(process.env.ORDER_REDIS_EXP)
        : 60 * 60 * 24  
    })
  }

  order = JSON.parse(order)

  const branch = await BranchOffice.findById(order.branchId)

  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId
  })

  if (!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BAD_USER_ INPUT',
        http: { status: 403 }
      }
    })
  }

  return order
}

export default order