import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import Recipe from "../../models/Recipe.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import client from "../../db/redis.client.js"
import Order from "../../models/Order.js"

async function deleteRecipe (__,{id},context) {

  const {error} = idSchema.validate(id)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  const recipe = await Recipe.findById(id)

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

  const orders = await Order.find({
    'items.recipeId': id
  })

  if(orders.length) {
    throw new GraphQLError('cannot delete recipe', {
      extensions: {
        code: 'CANNOT_DELETE_RECIPE', // Use a custom error code for access denial
        http: { status: 409 }
      }
    })
  }

  await Recipe.findByIdAndDelete(id)

  await client.del(`recipes:${id}`)

  return JSON.parse(JSON.stringify(recipe))
}

export default deleteRecipe