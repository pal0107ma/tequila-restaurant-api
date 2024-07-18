import Restaurant from "../../models/Restaurant.js" // Import Restaurant model
import BranchOffice from "../../models/BranchOffice.js" // Import BranchOffice model
import Joi from "joi" // Import Joi for validation
import idSchema from "../../schemas/idSchema.js" // Import ID validation schema
import { GraphQLError } from "graphql" // Import GraphQLError for error handling
import RecipeCategory from "../../models/RecipeCategory.js" // Import RecipeCategory model
import client from "../../db/redis.client.js" // Import Redis client

async function recipeCategories(__, args, context) {
  // 1. Validate branchId argument
  const schema = Joi.object().keys({
    branchId: idSchema // Use pre-defined ID validation schema
  })

  const { error, value: { branchId } } = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  // 2. Verify access to the branch
  // Find user's restaurants
  const restaurants = await Restaurant.find({
    userId: context.user._id
  })

  // Find the branch with matching ID and belonging to user's restaurants
  const branch = await BranchOffice.findOne({
    _id: branchId,
    restaurantId: {
      $in: restaurants.map(({ _id }) => _id) // Use map to extract restaurant IDs
    }
  })

  // Check authorization for the branch (if any)
  const authorized = ((branchAccess) => branchAccess ?
      branchAccess.branchRole.includes('CHEF') // Check for 'CHEF' role
    : null
  )(context.user.allowedBranches.find((doc) => doc.branchId === branchId ))

  if (!branch && !authorized) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 403 }
      }
    })
  }

  // 3. Retrieve recipe categories with caching
  let result = await client.get(`recipe-categories:${branchId}`)

  if (!result) {
    // Cache miss: fetch from database
    result = await RecipeCategory.find({ branchId })

    if (!result.length) return [] // Return empty array if no categories found

    // Convert to JSON for caching
    result = JSON.stringify(result)

    await client.set(`recipe-categories:${branchId}`, result, {
      EX: process.env.PRODUCT_CATEGORY_REDIS_EXP
        ? Number(process.env.PRODUCT_CATEGORY_REDIS_EXP)
        : 60 * 60 * 24 // Set expiry time (default 1 day)
    })
  }

  // Parse JSON back to object
  result = JSON.parse(result)

  return result;
}

export default recipeCategories;
