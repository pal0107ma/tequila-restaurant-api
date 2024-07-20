import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import Recipe from "../../models/Recipe.js"
import BranchOffice from "../../models/BranchOffice.js"
import Restaurant from "../../models/Restaurant.js"
import client from "../../db/redis.client.js"
import Joi from "joi"
import RecipeCategory from "../../models/RecipeCategory.js"


async function updateRecipe(__, args,context) {

  const schema = Joi.object().keys({
    id: idSchema,
    name: Joi.string().trim().min(3).max(30).optional().empty(null),
    description: Joi.string().trim().min(3).max(60).optional().empty(null),
    category: idSchema.optional().empty(null),
  })

  const { error, value: { id, category: categoryId, name, description }} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  let recipe = await Recipe.findById(id)

  if(!recipe) return null


  // Check if the branch associated with the product exists
  const branch = await BranchOffice.findById(recipe.branchId)

  // 2. VERIFY ACCESS
  // Find all restaurants owned by the current user
  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId
  })

  // Check user role and category permission (if provided) for the branch
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

  if(categoryId){
    // Additionally, check if the category exists for the specific branch
    const category = await RecipeCategory.findOne({_id: categoryId, branchId:recipe.branchId})

    if (!category) {
      throw new GraphQLError('category was not found', {
          extensions: {
            code: 'CATEGORY_NOT_FOUND',
            http: { status: 409 }
          }
      })
    }

    recipe.category = categoryId

  }

  if(name) recipe.name = name

  if(description) recipe.description = description

  await recipe.save()

  recipe = JSON.stringify(recipe)

  await client.set(`recipes:${id}`,recipe,{
    EX: process.env.RECIPE_REDIS_EXP
      ? Number(process.env.RECIPE_REDIS_EXP)
      : 60 * 60 * 24
  })

  return JSON.parse(recipe)
}

export default updateRecipe