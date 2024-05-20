import Product from "../../models/Product.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"

async function products(__,args, context) {

  // VALIDATE ARGS
  const schema = Joi.object().keys({
    branchId: idSchema,
    q: Joi.string().trim().optional().empty(""),
    count: Joi.number().integer().max(100).min(5).default(5),
    offset: Joi.number().integer().min(0).default(0),
  })

  const {error, value:{branchId,q,offset, count}} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  // SEARCH CONFIG
  const search = {
    branchId
  }

  // ADD QUERY
  if(q) {
    const regexp = new RegExp(q,'i')

    search.$or = [ 
      { name: regexp },
      { description: regexp },
      { category: regexp },
    ]    
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
  
  // RETURN RESULTS
  let results = await Product.find(search).skip(offset).limit(count).sort({createdAt: 1})

  results = JSON.stringify(results)

  results = JSON.parse(results)

  return results
  
}

export default products