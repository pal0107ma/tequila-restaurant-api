import Product from "../../models/Product.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import client from "../../db/redis.client.js"

async function updateProduct(__,args, context) {

  // VALIDATE USER INPUT
  const schema = Joi.object().keys({
    id: idSchema,
    name: Joi.string().min(3).max(50).optional().empty(null),
    description: Joi.string().min(3).max(100).optional().empty(null),
    category: Joi.string().min(3).max(50).optional().empty(null),
    countableAmount: Joi.number().integer().min(1).optional().empty(null),
    measureUnit: Joi.string().optional().allow(null),
    contentAmountWeight: Joi.number().integer().min(1).optional().empty(null),
  })

  const {error, value:{id,...input}} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  // FIND PRODUCT
  let product = await Product.findById(id)

  // PRODUCT NOT FOUND
  if(!product) return null

  // VERIFY ACCESS
  const branch = await BranchOffice.findById(product.branchId)

  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId
  })

  if(!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 403 }
      }
    })
  }

  // UPDATE PRODUCT
  await Product.findByIdAndUpdate(id,input)

  // DELETE AND RESTORE PRODUCT
  product = JSON.stringify({...product._doc, ...input})

  await client.del(`products:${id}`)

  await client.set(`products:${id}`, product, {
    EX: process.env.PRODUCT_REDIS_EXP
      ? Number(process.env.PRODUCT_REDIS_EXP)
      : 60 * 60 * 24,
    NX: true
  })

  // RETURN DATA

  product = JSON.parse(product)

  return product
}

export default updateProduct