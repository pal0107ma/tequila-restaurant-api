import Joi from "joi"; // Import the Joi validation library
import idSchema from "../../schemas/idSchema.js"; // Import the ID validation schema
import { GraphQLError } from "graphql";
// Import the necessary models
import BranchOffice from "../../models/BranchOffice.js";
import Restaurant from "../../models/Restaurant.js";
import Order from "../../models/Order.js";

async function orders (__,args,context) {
  // Define schema for input validation using Joi
  const schema = Joi.object().keys({
    branchId: idSchema, // Define branchId schema
    count: Joi.number().integer().max(100).min(5).default(5), // Define result count schema
    offset: Joi.number().integer().min(0).empty(null), // Define offset schema
  })

  // Validate the input arguments against the schema
  const { error, value: { branchId, offset, count } } = schema.validate(args)

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
  if (!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'RECIPES_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  }

  let result= await Order.find(search).limit(count).skip(offset).sort({ createdAt: -1 })

  return JSON.parse(JSON.stringify(result))

}


export default orders