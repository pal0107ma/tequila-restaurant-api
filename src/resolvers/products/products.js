// Import necessary models
import Product from "../../models/Product.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"

// Import validation library and schema
import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"

// Import GraphQLError for error handling
import { GraphQLError } from "graphql"

async function products(__, args, context) {

  // 1. VALIDATE USER INPUT
  // Define the validation schema for the product listing arguments
  const schema = Joi.object().keys({
    branchId: idSchema, // Reuse id validation schema (ensure valid branch ID)
    category: idSchema.optional().empty(null), // Optional category ID with null handling
    q: Joi.string().trim().optional().empty(""), // Optional trimmed search query (defaults to empty string)
    count: Joi.number().integer().max(100).min(5).default(5), // Count with limits and default value (5)
    offset: Joi.number().integer().min(0).default(0), // Offset with minimum and default value (0)
  })

  // Validate the provided arguments against the schema
  const { error, value: { branchId, category, q, offset, count } } = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 400 }
      }
    })
  }

  // 2. BUILD SEARCH CONFIGURATION
  // Create a search object to hold filtering criteria based on arguments

  const search = {
    branchId // Always include branch ID for filtering
  }

  // Add category filter if a category ID is provided
  if (category) {
    search.category = category
  }

  // Add full-text search using regular expression if a search query is provided
  if (q) {
    const regexp = new RegExp(q, 'i') // Case-insensitive search using regular expression
    search.$or = [ // Search across multiple fields using OR operator
      { name: regexp }, // Search product name
      { description: regexp }, // Search product description
    ]
  }

  // 3. VERIFY USER ACCESS
  // Check if the user has access to the requested branch

  // Find the branch associated with the branch ID
  const branch = await BranchOffice.findById(branchId)

  if (!branch) {
    throw new GraphQLError('branch was not found', {
      extensions: {
        code: 'BRANCH_NOT_FOUND',
        http: { status: 409 }
      }
    })
  }

  // Find the restaurant owned by the user that contains the branch
  const restaurant = await Restaurant.findOne({
    userId: context.user._id, // Match user ID in context
    _id: branch.restaurantId // Match restaurant ID in branch object
  })

  // Check user role and category permissions based on context
  const authorized = ((branchAccess) => {
    if (!branchAccess) return null // No access if no branch access found

    const hasRole = branchAccess.branchRole.includes('STORER') // Check for 'STORER' role

    // Check category permission if provided, otherwise filter by allowed categories
    const hasCategory = category ? branchAccess.categoriesId.includes(category) : null 

    if (hasCategory === null) { // If no specific category provided, filter by all allowed categories
      search.category = { $in: branchAccess.categoriesId } 
    }

    return hasRole ? (hasCategory !== null ? hasCategory : true) : false // Combine role and category checks

  })(context.user.allowedBranches.find((doc) => doc.branchId === branchId ))


  if (!restaurant && !authorized) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BRANCH_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  }

  // 4. FIND PRODUCTS
  // Find products matching the search criteria

  let results = await Product.find(search).skip(offset).limit(count).sort({createdAt: -1}) // Sort by creation date

  // 5. RETURN RESULTS
  // Convert the retrieved product data to a JavaScript object and return it
  return JSON.parse(JSON.stringify(results))
}

export default products
