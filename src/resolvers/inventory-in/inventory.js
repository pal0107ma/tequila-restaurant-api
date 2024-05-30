import Product from "../../models/Product.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import InventoryIn from "../../models/InventoryIn.js"

async function inventory(__, args, context) {

  const schema = Joi.object().keys({
    category: idSchema.optional().empty(null),
    branchId: idSchema,
    q: Joi.string().trim().optional().empty(""),
    count: Joi.number().integer().max(100).min(5).default(5),
    offset: Joi.number().integer().min(0).empty(null),
  })

  const {error, value:{
    branchId,
    q,
    category,
    offset, 
    count, 
  }} = schema.validate(args)

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
  const branch = await BranchOffice.findById(branchId)

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

  // SEARCH CONFIG
  const search = {
   $and: [{branchId}]
  }

  if(q) {

    const regex = new RegExp(q,'i')

    search.$or = [
      {name: regex},
      {description: regex},
    ]

  }

  if(category) {
    search.$and.push({ category })
  }

  let products 

  if(q || category) {
    products = await Product.find(search)
  }

  let result = await InventoryIn.find(
    products ?
        { 
          productId : {
            $in: products.map((_id)=> _id)
          }
        }
      : search
  ).limit(count).skip(offset).sort({createdAt: -1}).populate([{path:'productId',select:'measureUnit'}])

  result = JSON.stringify(result)

  result = JSON.parse(result)

  return result

}

export default inventory