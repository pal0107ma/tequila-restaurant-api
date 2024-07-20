import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import Recipe from "../../models/Recipe.js"
import BranchOffice from "../../models/BranchOffice.js"
import Restaurant from "../../models/Restaurant.js"

async function recipes (__,args, context) {

  // Define schema for input validation using Joi
  const schema = Joi.object().keys({
    category: idSchema.optional().empty(null), // Define category schema
    branchId: idSchema, // Define branchId schema
    q: Joi.string().trim().optional().empty(""), // Define query string schema
    count: Joi.number().integer().max(100).min(5).default(5), // Define result count schema
    offset: Joi.number().integer().min(0).empty(null), // Define offset schema
  })

  // Validate the input arguments against the schema
  const { error, value: { branchId, q, category, offset, count } } = schema.validate(args)

  // Handle validation errors
  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  // Define the search configuration based on input arguments
  const search = {
    branchId
  }

  // Add category to search if provided
  if (category) {
    search.category = category
  }

  // Verify user's access permissions
  const authorized = ((branchAccess) => branchAccess ?
    branchAccess.branchRole.includes('CHEF'): null
  )(context.user.allowedBranches.find((doc) => doc.branchId === branchId))

  // Fetch branch details based on branchId
  const branch = await BranchOffice.findById(branchId)

  if (!branch) {
    throw new GraphQLError('branch was not found', {
      extensions: {
        code: 'BRANCH_NOT_FOUND',
        http: { status: 409 }
      }
    })
  }

  // Find the restaurant associated with the branch office and the user
  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId
  })

  // Handle unauthorized access
  if (!restaurant && !authorized) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'RECIPES_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  }

  // Apply search query string if provided
  if (q) {
    const regex = new RegExp(q, 'i')
    search.$or = [
      { name: regex },
      { description: regex },
    ]
  }

  let result= await Recipe.find(search).limit(count).skip(offset).sort({ createdAt: -1 })

  return JSON.parse(JSON.stringify(result))
}

export default recipes