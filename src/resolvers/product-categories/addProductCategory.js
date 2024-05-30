
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import ProductCategory from "../../models/ProductCategory.js"
import client from "../../db/redis.client.js"

async function addProductCategory(__, args, context) {

  const schema = Joi.object().keys({
    branchId: idSchema,
    name: Joi.string().min(3).max(50).trim().uppercase()
  })

  const {error, value:{branchId, name}} = schema.validate(args)

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

  const exists = await ProductCategory.findOne({name, branchId})

  if(exists) {
    throw new GraphQLError('similar category already exists', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 409 }
      }
    })
  }

  let productCategory = new ProductCategory({name, branchId})

  await productCategory.save()

  await client.del(`product-categories:${branchId}`)

  productCategory = JSON.stringify(productCategory)

  productCategory = JSON.parse(productCategory)

  return productCategory
}

export default addProductCategory