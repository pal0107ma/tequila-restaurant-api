
// Import necessary models and modules
import Product from "../../models/Product.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import InventoryEntry from "../../models/InventoryEntry.js"

async function addInventoryEntry (__, args, context) {

  // Define schema for input validation using Joi
  const schema = Joi.object().keys({
    branchId: idSchema,
    productId: idSchema,
    purchasePrice: Joi.number().min(0.0001),
    quantity: Joi.number().integer().min(1),
  })

  // Validate the input arguments against the schema
  const { error,
    value: {
      productId,
      purchasePrice,
      quantity
    }
  } = schema.validate(args)

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

  // Fetch the product information based on productId
  const product = await Product.findById(productId)

  // Check if product exists
  if (!product) {
    throw new GraphQLError('product was not found', {
      extensions: {
        code: 'PRODUCT_NOT_FOUND',
        http: { status: 409 }
      }
    })
  }

  // Fetch the branch office related to the product
  const branch = await BranchOffice.findById(product.branchId)

  // Find the restaurant associated with the branch office and the user
  const restaurant = await Restaurant.findOne({
    _id: branch.restaurantId,
    userId: context.user._id
  })

  // Check user's authorization to access the product
  const authorized = ((branchAccess) => branchAccess ? branchAccess.branchRole.includes('STORER') && branchAccess.categoriesId.includes(String(product.category)) : null)(context.user.allowedBranches.find((doc) => doc.branchId === String(product.branchId)))

  // Handle unauthorized access
  if (!restaurant && !authorized) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'PRODUCT_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  }

  // Calculate total units based on product quantity
  const totalUnits = product.contentAmountWeight * product.countableAmount * quantity

  // Create a new inventory entry object
  let inventoryEntry = new InventoryEntry({
    branchId: product.branchId,
    productId,
    purchasePrice: purchasePrice.toFixed(4),
    quantity,
    totalUnits,
    unitCost: (purchasePrice / totalUnits).toFixed(4)
  })

  // Save the inventory entry to the database
  await inventoryEntry.save()

  // Return the inventory entry object as JSON string
  return JSON.parse(JSON.stringify(inventoryEntry))
}

// Export the addInventoryEntry function
export default addInventoryEntry

