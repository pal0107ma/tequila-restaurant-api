// Import necessary models and modules
import Product from "../../models/Product.js" // Import Product model
import Restaurant from "../../models/Restaurant.js" // Import Restaurant model
import BranchOffice from "../../models/BranchOffice.js" // Import BranchOffice model
import Joi from "joi" // Import Joi for input validation
import idSchema from "../../schemas/idSchema.js" // Import idSchema for validation
import { GraphQLError } from "graphql" // Import GraphQLError for error handling
import InventoryEntry from "../../models/InventoryEntry.js" // Import InventoryEntry model

// Async function to fetch inventory entries based on input arguments
async function inventoryEntries(__, args, context) {

  // Define schema for input validation using Joi
  const schema = Joi.object().keys({
    category: idSchema.optional().empty(null), // Define category schema
    branchId: idSchema, // Define branchId schema
    q: Joi.string().trim().optional().empty(""), // Define query string schema
    count: Joi.number().integer().max(100).min(5).default(5), // Define result count schema
    offset: Joi.number().integer().min(0).empty(null), // Define offset schema
  })

  // Validate the input arguments against the schema
  const { error, value: { branchId, q, category, offset, count } } = schema.validate(args)

  // Handle validation errors
  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  // Define the search configuration based on input arguments
  const search = {
    branchId
  }

  // Add category to search if provided
  if (category) {
    search.category = category
  }

  // Verify user's access permissions
  const authorized = ((branchAccess) => {
    if (!branchAccess) return null

    const hasRole = branchAccess.branchRole.includes('STORER')
    const hasCategory = category ? branchAccess.categoriesId.includes(category) : null

    if (hasCategory === null) search.category = { $in: branchAccess.categoriesId }

    return hasRole ? (hasCategory !== null ? hasCategory : true) : false
  })(context.user.allowedBranches.find((doc) => doc.branchId === branchId))

  // Fetch branch details based on branchId
  const branch = await BranchOffice.findById(branchId)

  // Find the restaurant associated with the branch office and the user
  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId
  })

  // Handle unauthorized access
  if (!restaurant && !authorized) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'INVENTORY_ENTRIES_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  }

  // Apply search query string if provided
  if (q) {
    const regex = new RegExp(q, 'i')
    search.$or = [
      { name: regex },
      { description: regex },
    ]
  }

  let products

  // Fetch products based on search criteria
  if (q || category) {
    products = await Product.find(search)
  }

  // Retrieve inventory entries based on products or search criteria
  let result = await InventoryEntry.find(
    products ?
      {
        productId: {
          $in: products.map((_id) => _id)
        }
      }
      : search // Search only by branch id
  ).limit(count).skip(offset).sort({ createdAt: -1 })

  // Convert result to JSON string and then parse it to return

  return JSON.parse(JSON.stringify(result))
}

// Export the inventoryEntries function
export default inventoryEntries