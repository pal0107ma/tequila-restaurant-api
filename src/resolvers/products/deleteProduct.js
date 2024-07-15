import Product from "../../models/Product.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import client from "../../db/redis.client.js"
import InventoryEntry from "../../models/InventoryEntry.js"

async function deleteProduct(__, { id }, context) {

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

  // 2. FIND PRODUCT
  // Fetch the product data from the MongoDB database using the ID
  let product = await Product.findById(id)

  // 3. PRODUCT NOT FOUND
  // If the product is not found in the database, return null
  if (!product) return null

  // 4. VERIFY ACCESS
  // Check user access to the product based on branch and category permissions

  // Find the branch associated with the product
  const branch = await BranchOffice.findById(product.branchId)

  // Find the restaurant owned by the user that contains the branch
  const restaurant = await Restaurant.findOne({
    _id: branch.restaurantId,
    userId: context.user._id
  })

  // Check user role and category permission (if provided) for the branch
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

  // 5. CHECK INVENTORY
  // Check if there are existing inventory entries for this product

  const inventoryEntries = await InventoryEntry.find({ productId: id })

  // 6. PRODUCT IN USE
  // If there's inventory for the product, prevent deletion and throw an error
  if (inventoryEntries.length) {
    throw new GraphQLError('cannot delete product with existing inventory', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 409 }
      }
    })
  }

  // 7. DELETE PRODUCT
  // Delete the product data from the MongoDB database

  await Product.findByIdAndDelete(id)

  // 8. DELETE FROM REDIS
  // Delete the product data from the Redis cache

  await client.del(`products:${id}`)

  // 9. RETURN DELETED PRODUCT (optional)
  // Return the deleted product data (useful for client-side updates)

  return JSON.parse(JSON.stringify(product))
}

export default deleteProduct
