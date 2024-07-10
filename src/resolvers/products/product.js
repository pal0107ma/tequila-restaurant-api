import Product from "../../models/Product.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import client from "../../db/redis.client.js"

async function product(__, { id }, context) {

  // 1. VALIDATE ARGS
  // Validate the provided product ID against the defined schema
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

  // 2. FIND IN REDIS
  // Attempt to retrieve the product data from Redis using the ID as the key
  let product = await client.get(`products:${id}`)

  // 3. NOT FOUND IN REDIS
  // If the product data is not found in Redis:
  if (!product) {
    // Fetch the product data from the MongoDB database using the ID
    product = await Product.findById(id)

    // 4. NOT FOUND IN DATABASE
    // If the product is not found in the database either, return null
    if (!product) return null

    // 5. STORE IN REDIS
    // Convert the product data to a JSON string for storage in Redis
    product = JSON.stringify(product)

    // Save the product data in Redis with the ID as the key and an expiration time
    await client.set(`products:${id}`, product, {
      EX: process.env.PRODUCT_REDIS_EXP
        ? Number(process.env.PRODUCT_REDIS_EXP)
        : 60 * 60 * 24  // Default expiration of 24 hours if no env variable set
    })
  }

  // Parse the JSON string back to a JavaScript object
  product = JSON.parse(product)

  // 6. VERIFY ACCESS
  // Check user access to the product based on branch and category permissions

  // Find the branch associated with the product
  const branch = await BranchOffice.findById(product.branchId)

  // Find the restaurant owned by the user that contains the branch
  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId
  })

  // Check user role and category permission (if provided) for the branch
  const authorized = ((branchAccess) => branchAccess ?
      branchAccess.branchRole.includes('STORER') && // Check for 'STORER' role
      branchAccess.categoriesId.includes(product.category) // Check category permission if provided
    : null
  )(context.user.allowedBranches.find((doc) => doc.branchId === product.branchId))

  if (!restaurant && !authorized) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BAD_USER_ INPUT',
        http: { status: 403 }
      }
    })
  }

  // 7. RETURN DATA
  // Return the retrieved product data
  return product
}

export default product
