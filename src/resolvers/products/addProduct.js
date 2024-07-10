// Import necessary models
import Product from "../../models/Product.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import ProductCategory from "../../models/ProductCategory.js"

async function addProduct(__, args, context) {

  // 1. VALIDATE USER INPUT
  // Define the validation schema for the product data
  const schema = Joi.object().keys({
    branchId: idSchema, // Reuse ID validation schema
    name: Joi.string().min(3).max(50).required(), // Name is required and has length limits
    description: Joi.string().min(3).max(100).required(), // Description is required and has length limits
    category: idSchema, // Reuse ID validation schema
    countableAmount: Joi.number().integer().min(1).required(), // Countable amount must be an integer and greater than 0
    measureUnit: Joi.string().allow(null), // Measure unit can be null
    contentAmountWeight: Joi.number().integer().min(1).required(), // Content amount must be an integer and greater than 0
  })

  // Validate the provided arguments against the schema
  const {error, value: { branchId, category: categoryId, ...input }} = schema.validate(args)

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
        branchAccess.branchRole.includes('STORER') && // Check for 'STORER' role
        branchAccess.categoriesId.includes(categoryId) // Check category permission if provided
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
  const category = await ProductCategory.findOne({_id: categoryId, branchId})

  if (!category) {
    throw new GraphQLError('category was not found', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 409 }
      }
    })
  }

  // 3. SAVE PRODUCT
  // Create a new product object with validated data
  let product = new Product({branchId, category: categoryId,...input})

  // Save the product to the database
  await product.save()

  // 4. RETURN DATA
  // Convert the saved product object to JSON string and back to object (safer for manipulation)
  return JSON.parse(JSON.stringify(product))
}

export default addProduct
