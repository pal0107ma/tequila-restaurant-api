import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import Recipe from "../../models/Recipe.js"
import RecipeCategory from "../../models/RecipeCategory.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"

async function addRecipe (__,args, context){

	const schema = Joi.object().keys({
			name: Joi.string().min(3).max(30),
			description: Joi.string().min(3).max(60),
			branchId: idSchema,
			category: idSchema,
	})

	const { error, value: { branchId, category: categoryId, ...input }} = schema.validate(args)

	if (error) {
		throw new GraphQLError(error.message, {
			extensions: {
				code: 'BAD_USER_INPUT',
				details: error.details,
				http: { status: 400 }
			}
		})
	}

    // Check if the branch associated with the product exists
  const branch = await BranchOffice.findById(branchId)

  if (!branch) {
    throw new GraphQLError('branch was not found', {
      extensions: {
        code: 'BRANCH_NOT_FOUND',
        http: { status: 409 }
      }
    })
  }

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
  )(context.user.allowedBranches.find((doc) => doc.branchId === branchId))

  if (!restaurant && !authorized) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BRANCH_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  }

   // Additionally, check if the category exists for the specific branch
   const category = await RecipeCategory.findOne({_id: categoryId, branchId})

   if (!category) {
     throw new GraphQLError('category was not found', {
        extensions: {
          code: 'CATEGORY_NOT_FOUND',
          http: { status: 409 }
        }
     })
   }

  const recipe = new Recipe({
    branchId,
    category: categoryId, 
    ...input
  })

  await recipe.save()

  return JSON.parse(JSON.stringify(recipe))
}

export default addRecipe