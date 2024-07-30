
import idSchema from "../../schemas/idSchema.js"; 
import BranchOffice from "../../models/BranchOffice.js";
import Restaurant from "../../models/Restaurant.js";
import Order from "../../models/Order.js";
import { GraphQLError } from "graphql"

import client from "../../db/redis.client.js";

async function deleteOrder (__,{id},context) {

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

  let order = await Order.findById(id)

  if(!order) return null

  const branch = await BranchOffice.findById(order.branchId)

  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId
  })

  if (!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'ORDER_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  }

  if(order.items.length) {
    throw new GraphQLError('cannot delete order', {
      extensions: {
        code: 'CANNOT_DELETE_ORDER', 
        http: { status: 409 }
      }
    })
  }

  await Order.findByIdAndDelete(id)

  await client.del(`orders:${id}`)

  return JSON.parse(JSON.stringify(order))
}


export default deleteOrder