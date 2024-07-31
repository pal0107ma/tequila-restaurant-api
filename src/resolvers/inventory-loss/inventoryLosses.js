import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import InventoryLoss from "../../models/InventoryLoss.js"

async function inventoryLosses (__, args, context) {

  const schema = Joi.object().keys({
    branchId: idSchema.optional().empty(null), 
    productId: idSchema, 
    count: Joi.number().integer().max(100).min(5).default(5), 
    offset: Joi.number().integer().min(0).empty(null), 
  })

  const { error, value: { branchId, offset, count, productId } } = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  const search = {
    branchId
  }

  if(productId) search.productId = productId

  const branch = await BranchOffice.findById(branchId)

  if (!branch) {
    throw new GraphQLError('branch was not found', {
      extensions: {
        code: 'BRANCH_NOT_FOUND',
        http: { status: 409 }
      }
    })
  }

  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId
  })

  if (!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'RECIPES_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  }

  let result= await InventoryLoss.find(search).limit(count).skip(offset).sort({ createdAt: -1 })

  return JSON.parse(JSON.stringify(result))
}

export default inventoryLosses