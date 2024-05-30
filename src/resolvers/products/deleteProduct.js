import Product from "../../models/Product.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import client from "../../db/redis.client.js"
import InventoryIn from "../../models/InventoryIn.js"

async function deleteProduct(__,{id}, context) {

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

  let product = await Product.findById(id)

  if(!product) return null

  const branch = await BranchOffice.findById(product.branchId)

  const restaurant = await Restaurant.findOne({
    _id: branch.restaurantId,
    userId: context.user._id
  })

  if (!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 404 }
      }
    })
  }

  const inventory = await InventoryIn.find({productId: id})

  if (inventory.length) {
    throw new GraphQLError('cannot delete product', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 409 }
      }
    })
  }

  await Product.findByIdAndDelete(id)

  await client.del(`products:${id}`)

  product = JSON.stringify(product)

  product = JSON.parse(product)

  return product
}

export default deleteProduct