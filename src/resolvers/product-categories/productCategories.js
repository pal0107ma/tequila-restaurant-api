
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import ProductCategory from "../../models/ProductCategory.js"
import client from "../../db/redis.client.js"

async function productCategories(__, args,context) {

  const schema = Joi.object().keys({
    branchId: idSchema
  })

  const {error, value:{ branchId }} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

   // VERIFY ACCESS
   const restaurants = await Restaurant.find({
    userId: context.user._id
  })

  const branch = await BranchOffice.findOne({ 
    _id: branchId, 
    restaurantId: {
      $in: restaurants.map(({_id}) => _id)
    }
  })

  if (!branch) {
    throw new GraphQLError('branch was not found or not allowed', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 404 }
      }
    })
  }

  let result = await client.get(`product-categories:${branchId}`)

  if(!result) {
    result = await ProductCategory.find({branchId})  

    if(!result.length) return []

    result = JSON.stringify(result)

    await client.set(`product-categories:${branchId}`, result, {
      EX: process.env.PRODUCT_CATEGORY_REDIS_EXP
        ? Number(process.env.PRODUCT_CATEGORY_REDIS_EXP)
        : 60 * 60 * 24,
      NX: true
    })
  }

  result = JSON.parse(result)

  return result
}

export default productCategories