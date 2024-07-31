import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import Recipe from "../../models/Recipe.js"
import BranchOffice from "../../models/BranchOffice.js"
import Restaurant from "../../models/Restaurant.js"
import client from "../../db/redis.client.js"
import Joi from "joi"
import Product from "../../models/Product.js"


async function addRecipeItem(__, args,context) {

  const schema = Joi.object().keys({
    recipeId: idSchema,
    productId: idSchema,
    quantity: Joi.number().greater(0),
  })

  const { error, value: { recipeId, quantity,productId }} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  let recipe = await Recipe.findById(recipeId)

  if(!recipe) {
      throw new GraphQLError('recipe was not found', {
      extensions: {
        code: 'RECIPE_NOT_FOUND',
        http: { status: 409 }
      }
    })
  }

  const product = await Product.findById(productId)

  if(!product) {
    throw new GraphQLError('product was not found', {
      extensions: {
        code: 'PRODUCT_NOT_FOUND',
        http: { status: 409 }
      }
    })
  }


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

  if (`${recipe.branchId}`!==`${product.branchId}`) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'PRODUCT_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  }

  const recipeItem = recipe.items.find((doc)=> `${doc.productId}` === productId)

  if(recipeItem) {
    throw new GraphQLError('similar item already has the same product id', {
      extensions: {
        code: 'PRODUCT_ALREADY_ADDED',
        http: { status: 409 }
      }
    })
  }

  recipe.items.push({quantity: quantity.toFixed(2),productId})


  await recipe.save()

  recipe = JSON.stringify(recipe)

  await client.set(`recipes:${recipeId}`,recipe,{
    EX: process.env.RECIPE_REDIS_EXP
      ? Number(process.env.RECIPE_REDIS_EXP)
      : 60 * 60 * 24
  })

  return JSON.parse(recipe)
}

export default addRecipeItem