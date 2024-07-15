import Restaurant from "../../models/Restaurant.js" // Import Restaurant model
import BranchOffice from "../../models/BranchOffice.js" // Import BranchOffice model
import idSchema from "../../schemas/idSchema.js" // Import id validation schema
import { GraphQLError } from "graphql" // Import GraphQLError for error handling
import client from "../../db/redis.client.js" // Import Redis client
import InventoryEntry from "../../models/InventoryEntry.js" // Import InventoryEntry model

/**
 * Deletes an inventory entry by ID.
 * 
 * This function first validates the provided ID using the `idSchema`. If valid, it fetches
 * the inventory entry and its associated product category from the database. It then checks 
 * user access permissions based on role and associated categories. If authorized, it deletes 
 * the entry from Redis cache and the database, and finally returns the deleted data.
 *
 * @param {object} _ (unused) - Root object from GraphQL resolver
 * @param {object} { id } - Argument object containing the inventory entry ID
 * @param {object} context - Context object containing user information
 * @returns {object|null} - The deleted inventory entry data or null if not found or unauthorized
 */
async function deleteInventoryEntry (__, {id}, context) {

  // Validate the provided ID
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

  // Find the inventory entry and populate product category
  let inventoryEntry = await InventoryEntry.findById(id)
    .populate({path:'productId',select: 'category'})

  // Not found in database
  if(!inventoryEntry) return null

  // Check user access permissions (same logic as in inventoryEntry function)
  const branch = await BranchOffice.findById(inventoryEntry.branchId)

  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId
  })

  const authorized = ((branchAccess) => branchAccess ?
      branchAccess.branchRole.includes('STORER') && // Check for 'STORER' role
      branchAccess.categoriesId.includes(String(inventoryEntry.productId.category)) // Check category permission if provided
    : null
  )(context.user.allowedBranches.find((doc) => doc.branchId === String(inventoryEntry.branchId)))

  if (!restaurant && !authorized) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'INVENTORY_ENTRY_ACCESS_DENIED', // Use a custom error code for access denial
        http: { status: 403 }
      }
    })
  }

  if (inventoryEntry.outs.length) {
    throw new GraphQLError('cannot delete inventory entry', {
      extensions: {
        code: 'CANNOT_DELETE_INVENTORY_ENTRY', // Use a custom error code for access denial
        http: { status: 409 }
      }
    })
  }

  // Delete from Redis cache
  await client.del(`inventory-in:${id}`)

  // Delete the inventory entry from database
  await InventoryEntry.findByIdAndDelete(id)

  // Return the deleted data (for logging purposes?)
  return JSON.parse(JSON.stringify(inventoryEntry)) // Deep copy to avoid reference issues
}

export default deleteInventoryEntry
