import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import Recipe from "../../models/Recipe.js"
import BranchOffice from "../../models/BranchOffice.js"
import Restaurant from "../../models/Restaurant.js"
import client from "../../db/redis.client.js"

async function deleteRecipeItem(__, {id},context) {

  const { error } = idSchema.validate(id)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  let recipe = await Recipe.findOne({
    'items._id': id
  })

  if(!recipe) return null

  const branch = await BranchOffice.findById(recipe.branchId)

  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId
  })

  const authorized = ((branchAccess) => branchAccess ?
      branchAccess.branchRole.includes('CHEF') 
    : null
  )(context.user.allowedBranches.find((doc) => doc.branchId === String(recipe.branchId)))

  if (!restaurant && !authorized) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'RECIPE_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  }

  recipe.items.pull(id)

  await recipe.save()

  const recipeId = recipe._id

  recipe = JSON.stringify(recipe)

  await client.set(`recipes:${recipeId}`,recipe,{
    EX: process.env.RECIPE_REDIS_EXP
      ? Number(process.env.RECIPE_REDIS_EXP)
      : 60 * 60 * 24
  })

  return JSON.parse(recipe)
}

export default deleteRecipeItem