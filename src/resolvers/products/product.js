import Product from "../../models/Product.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import client from "../../db/redis.client.js"

async function product(__,{id}, context) {

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
  let product = await client.get(`products:${id}`)

  // NOT FOUND IN REDIS
  if(!product) {

    product = await Product.findById(id)

    // NOT FOUND
    if(!product) return null

    // STORE IN REDIS
    product = JSON.stringify(product)

    await client.set(`products:${id}`, product, {
      EX: process.env.PRODUCT_REDIS_EXP
        ? Number(process.env.PRODUCT_REDIS_EXP)
        : 60 * 60 * 24,
      NX: true
    })
  }

  product = JSON.parse(product)

  // VERIFY ACCESS

  const branch = await BranchOffice.findById(product.branchId)

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
  
  return product
}

export default product