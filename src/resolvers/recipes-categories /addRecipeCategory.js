import Restaurant from "../../models/Restaurant.js" // Import Restaurant model
import BranchOffice from "../../models/BranchOffice.js" // Import BranchOffice model
import Joi from "joi" // Import Joi for validation
import idSchema from "../../schemas/idSchema.js" // Import ID validation schema
import { GraphQLError } from "graphql" // Import GraphQLError for error handling
import RecipeCategory from "../../models/RecipeCategory.js" // Import RecipeCategory model
import client from "../../db/redis.client.js" // Import Redis client

async function addRecipeCategory(__, args, context) {
  // 1. Validate arguments (branchId and name)
  const schema = Joi.object().keys({
    branchId: idSchema, // Reuse pre-defined ID validation schema (already commented)
    name: Joi.string()
      .min(3) // Minimum length of 3 characters (already commented)
      .max(50) // Maximum length of 50 characters (already commented)
      .trim() // Remove leading/trailing whitespace (already commented)
      .uppercase() // Convert to uppercase (already commented)
  })

  const { error, value: { branchId, name } } = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 400 }
      }
    })
  }

  // Find the branch with matching ID and belonging to user's restaurants
  const branch = await BranchOffice.findById(branchId)

  if (!branch) {
    throw new GraphQLError('branch was not found', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 409 }
      }
    })
  }

  // 2. Verify access to the branch
  // Find user's restaurant that include the branch
  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId
  })

  if (!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BRANCH_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  }

  // 3. Check for existing category with the same name in the branch
  const exists = await RecipeCategory.findOne({ name, branchId })

  if (exists) {
    throw new GraphQLError('A category with the same name already exists in this branch', {
      extensions: {
        code: 'CATEGORY_ALREADY_EXISTS',
        http: { status: 409 } // Conflict: Already exists (already commented)
      }
    })
  }

  // 4. Create and save new recipe category
  const productCategory = new RecipeCategory({ name, branchId })
  await productCategory.save()

  // 5. Invalidate recipe category cache for the branch (already commented)
  await client.del(`recipe-categories:${branchId}`)

  // 6. Return the created recipe category
  return JSON.parse(JSON.stringify(productCategory)) // Prevent potential object manipulation (already commented)
}

export default addRecipeCategory
