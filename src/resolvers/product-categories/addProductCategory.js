import Restaurant from "../../models/Restaurant.js" // Import Restaurant model
import BranchOffice from "../../models/BranchOffice.js" // Import BranchOffice model
import Joi from "joi" // Import Joi for validation
import idSchema from "../../schemas/idSchema.js" // Import ID validation schema
import { GraphQLError } from "graphql" // Import GraphQLError for error handling
import ProductCategory from "../../models/ProductCategory.js" // Import ProductCategory model
import client from "../../db/redis.client.js" // Import Redis client

async function addProductCategory(__, args, context) {
  // 1. Validate arguments (branchId and name)
  const schema = Joi.object().keys({
    branchId: idSchema, // Reuse pre-defined ID validation schema
    name: Joi.string()
      .min(3) // Minimum length of 3 characters
      .max(50) // Maximum length of 50 characters
      .trim() // Remove leading/trailing whitespace
      .uppercase() // Convert to uppercase
  })

  const { error, value: { branchId, name } } = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 400 }
      }
    })
  }

  // 2. Verify access to the branch
  // Find user's restaurants
  const restaurants = await Restaurant.find({
    userId: context.user._id
  })

  // Find the branch with matching ID and belonging to user's restaurants
  const branch = await BranchOffice.findOne({
    _id: branchId,
    restaurantId: {
      $in: restaurants.map(({ _id }) => _id) // Use map to extract restaurant IDs
    }
  })

  if (!branch) {
    throw new GraphQLError('branch was not found or not allowed', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 404 }
      }
    })
  }

  // 3. Check for existing category with the same name
  const exists = await ProductCategory.findOne({ name, branchId })

  if (exists) {
    throw new GraphQLError('A category with the same name already exists in this branch', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 409 } // Conflict: Already exists
      }
    })
  }

  // 4. Create and save new product category
  const productCategory = new ProductCategory({ name, branchId })
  await productCategory.save()

  // 5. Invalidate product category cache for the branch
  await client.del(`product-categories:${branchId}`)

  // 6. Return the created product category
  return JSON.parse(JSON.stringify(productCategory)) // Avoid potential object manipulation issues
}

export default addProductCategory
