import Product from "../../models/Product.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import client from "../../db/redis.client.js"

async function updateProduct(__, args, context) {

  // 1. VALIDATE USER INPUT
  // Define the validation schema for the product update arguments
  const schema = Joi.object().keys({
    id: idSchema, // Reuse ID validation schema
    name: Joi.string().min(3).max(50).optional().empty(null), // Optional name with length limits and null handling
    description: Joi.string().min(3).max(100).optional().empty(null), // Optional description with length limits and null handling
    category: Joi.string().min(3).max(50).optional().empty(null), // Optional category ID with length limits and null handling
    countableAmount: Joi.number().integer().min(1).optional().empty(null), // Optional countable amount with minimum value and null handling
    measureUnit: Joi.string().optional().allow(null), // Optional measure unit that can be null
    contentAmountWeight: Joi.number().integer().min(1).optional().empty(null), // Optional content amount/weight with minimum value and null handling
  })

  // Validate the provided arguments against the schema
  const { error, value: { id, ...input } } = schema.validate(args) // Destructure validated ID and remaining update data

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  // 2. FIND PRODUCT
  // Fetch the product data from the MongoDB database using the ID

  let product = await Product.findById(id)

  // 3. PRODUCT NOT FOUND
  // If the product is not found, return null

  if (!product) return null

  // 4. VERIFY ACCESS
  // Check user access to the product based on branch and category permissions

  // Find the branch associated with the product
  const branch = await BranchOffice.findById(product.branchId)

  // Find the restaurant owned by the user that contains the branch
  const restaurant = await Restaurant.findOne({
    userId: context.user._id, // Match user ID in context
    _id: branch.restaurantId // Match restaurant ID in branch object
  })

  // Check user role and category permissions based on context
  const authorized = ((branchAccess) => branchAccess ?
      branchAccess.branchRole.includes('STORER') && // Check for 'STORER' role
      branchAccess.categoriesId.includes(String(product.category)) // Check category permission if provided
    : null
  )(context.user.allowedBranches.find((doc) => String(product.branchId) === doc.branchId)) // Ensure branch ID type consistency

  if (!restaurant && !authorized) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 403 }
      }
    })
  }

  // 5. UPDATE PRODUCT
  // Update the product data in the MongoDB database using the provided input

  await Product.findByIdAndUpdate(id, input)

  // 6. UPDATE AND REFRESH REDIS CACHE (optimistic update)
  // Create a new product object with merged data (existing and updated)
  product = JSON.stringify({ ...product._doc, ...input })

  // Set the updated product data in the Redis cache with expiration
  await client.set(`products:${id}`, product, {
    EX: process.env.PRODUCT_REDIS_EXP
      ? Number(process.env.PRODUCT_REDIS_EXP)
      : 60 * 60 * 24, // Default expiration of 24 hours if no env variable set
  })

  // 7. RETURN DATA
  // Parse the updated product data back to a JavaScript object
  return JSON.parse(product)
}

export default updateProduct