import Restaurant from "../../models/Restaurant.js" // Import Restaurant model
import BranchOffice from "../../models/BranchOffice.js" // Import BranchOffice model
import idSchema from "../../schemas/idSchema.js" // Import ID validation schema
import { GraphQLError } from "graphql" // Import GraphQLError for error handling
import RecipeCategory from "../../models/RecipeCategory.js" // Import RecipeCategory model
import client from "../../db/redis.client.js" // Import Redis client
import Recipe from "../../models/Recipe.js" // Import Recipe model

async function deleteRecipeCategory(__, { id }, context) {
  // 1. Validate recipe category ID
  const { error } = idSchema.validate(id)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 400 }
      }
    })
  }

  // 2. Find recipe category by ID
  let recipeCategory = await RecipeCategory.findById(id)

  if (!recipeCategory) {
    // Category not found, return null (no error)
    return null
  }

  // 3. Retrieve branch associated with the category
  const branch = await BranchOffice.findById(recipeCategory.branchId)

  // 4. Verify user has access to the branch (restaurant ownership)
  const restaurant = await Restaurant.findOne({
    _id: branch.restaurantId, // Find restaurant of the branch
    userId: context.user._id // Check if it belongs to the current user
  })

  if (!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 403 } // Forbidden (access denied)
      }
    })
  }

  // 5. Check if there are recipes associated with the category
  const recipes = await Recipe.find({ category: id })

  if (recipes.length) {
    throw new GraphQLError('cannot delete recipe category with associated recipes', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 409 } // Conflict: Cannot delete due to related recipes
      }
    })
  }

  // 6. Delete the recipe category
  await RecipeCategory.findByIdAndDelete(id)

  // 7. Invalidate recipe category cache for the branch
  await client.del(`recipe-categories:${recipeCategory.branchId}`)

  // 8. Return the deleted recipe category (for informational purposes)
  return JSON.parse(JSON.stringify(recipeCategory)) // Avoid potential object manipulation issues
}

export default deleteRecipeCategory