import Restaurant from "../../models/Restaurant.js" // Import Restaurant model
import BranchOffice from "../../models/BranchOffice.js" // Import BranchOffice model
import idSchema from "../../schemas/idSchema.js" // Import ID validation schema
import { GraphQLError } from "graphql" // Import GraphQLError for error handling
import ProductCategory from "../../models/ProductCategory.js" // Import ProductCategory model
import client from "../../db/redis.client.js" // Import Redis client
import Product from "../../models/Product.js" // Import Product model

async function deleteProductCategory(__, { id }, context) {
  // 1. Validate product category ID
  const { error } = idSchema.validate(id)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 400 }
      }
    })
  }

  // 2. Find product category by ID
  let productCategory = await ProductCategory.findById(id)

  if (!productCategory) {
    // Category not found, return null (no error)
    return null
  }

  // 3. Retrieve branch associated with the category
  const branch = await BranchOffice.findById(productCategory.branchId)

  // 4. Verify user has access to the branch (restaurant ownership)
  const restaurant = await Restaurant.findOne({
    _id: branch.restaurantId, // Find restaurant of the branch
    userId: context.user._id // Check if it belongs to the current user
  })

  if (!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 403 } // Forbidden (access denied)
      }
    })
  }

  // 5. Check if there are products associated with the category
  const products = await Product.find({ category: id })

  if (products.length) {
    throw new GraphQLError('cannot delete product category with associated products', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 409 } // Conflict: Cannot delete due to related products
      }
    })
  }

  // 6. Delete the product category
  await ProductCategory.findByIdAndDelete(id)

  // 7. Invalidate product category cache for the branch
  await client.del(`product-categories:${productCategory.branchId}`)

  // 8. Return the deleted product category (for informational purposes)
  return JSON.parse(JSON.stringify(productCategory)) // Avoid potential object manipulation issues
}

export default deleteProductCategory