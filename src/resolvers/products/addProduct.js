import Product from "../../models/Product.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"

async function addProduct(__,args, context) {

  // VALIDATE USER INPUT
  const schema = Joi.object().keys({
    branchId: idSchema,
    name: Joi.string().min(3).max(50),
    description: Joi.string().min(3).max(100),
    category: Joi.string().min(3).max(50),
    countableAmount: Joi.number().integer().min(1),
    measureUnits: Joi.string().allow(null),
    contentAmountWeight: Joi.number().integer().min(1),
  })


  const {error, value:{branchId,...input}} = schema.validate(args)

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

  // SAVE PRODUCT
  let product = new Product({branchId,...input})

  await product.save()

  // RETURN DATA
  product = JSON.stringify(product)

  return JSON.parse(product)
}

export default addProduct