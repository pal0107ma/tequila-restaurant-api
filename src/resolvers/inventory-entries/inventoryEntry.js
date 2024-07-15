import Restaurant from "../../models/Restaurant.js" // Import Restaurant model
import BranchOffice from "../../models/BranchOffice.js" // Import BranchOffice model
import idSchema from "../../schemas/idSchema.js" // Import id validation schema
import { GraphQLError } from "graphql" // Import GraphQLError for error handling
import client from "../../db/redis.client.js" // Import Redis client
import InventoryEntry from "../../models/InventoryEntry.js" // Import InventoryEntry model

/**
 * Fetches an inventory entry by ID.
 * 
 * This function first validates the provided ID using the `idSchema`. If valid, it attempts
 * to retrieve the entry from Redis cache. If not found in cache, it fetches from the database
 * using the `InventoryEntry` model and stores it in Redis with an expiration time set by 
 * `process.env.INVENTORY_IN_REDIS_EXP` (defaults to 24 hours). Finally, it checks access permissions
 * based on user's role and associated categories before returning the data.
 *
 * @param {object} _ (unused) - Root object from GraphQL resolver
 * @param {object} { id } - Argument object containing the inventory entry ID
 * @param {object} context - Context object containing user information
 * @returns {object|null} - The inventory entry data or null if not found or unauthorized
 */
async function inventoryEntry (__, {id}, context) {

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

  // Check Redis cache for the inventory entry
  let inventoryEntry = await client.get(`inventory-in:${id}`)

  if(!inventoryEntry) {

    // Not found in cache, fetch from database
    inventoryEntry = await InventoryEntry.findById(id).populate({path:'productId',select: 'category'})

    if(!inventoryEntry) return null // Not found in database either

    // Stringify the data before storing in Redis
    inventoryEntry = JSON.stringify(inventoryEntry)

    // Set the inventory entry in Redis with expiration
    await client.set(`inventory-in:${id}`, inventoryEntry, {
      EX: process.env.INVENTORY_IN_REDIS_EXP
        ? Number(process.env.INVENTORY_IN_REDIS_EXP)
        : 60 * 60 * 24, // Default 24 hours
      NX: true // Set only if key doesn't exist
    })
  }

  // Parse the JSON string back to object
  inventoryEntry = JSON.parse(inventoryEntry)

  // Find the branch associated with the inventory entry
  const branch = await BranchOffice.findById(inventoryEntry.branchId)

  // Find the restaurant associated with the branch (using user context)
  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId
  })

  // Check user access permissions based on role and categories
  const authorized = ((branchAccess) => branchAccess ?
      branchAccess.branchRole.includes('STORER') && // Check for 'STORER' role
      branchAccess.categoriesId.includes(inventoryEntry.productId.category) // Check category permission if provided
    : null
  )(context.user.allowedBranches.find((doc) => doc.branchId === inventoryEntry.branchId))

  if (!restaurant && !authorized) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'INVENTORY_ENTRY_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  }

  // Return the inventory entry data
  return inventoryEntry
}

export default inventoryEntry
