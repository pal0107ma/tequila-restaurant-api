
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import ProductCategory from "../../models/ProductCategory.js"
import client from "../../db/redis.client.js"
import User from "../../models/User.js"
import Product from "../../models/Product.js"

async function deleteProductCategory(__, {id}, context){

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

  let productCategory = await ProductCategory.findById(id)

  if(!productCategory) return null

  const branch = await BranchOffice.findById(productCategory.branchId)

  const restaurant = await Restaurant.findOne({
    _id: branch.restaurantId,
    userId: context.user._id
  })

  if (!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 404 }
      }
    })
  }

  const users = await User.find({'allowedBranches.categoriesId':{
    $in: [id]
  }})

  const products = await Product.find({category: id})

  if (users.length || products.length) {
    throw new GraphQLError('cannot delete product category', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 409 }
      }
    })
  }

  await ProductCategory.findByIdAndDelete(id)

  await client.del(`product-categories:${productCategory.branchId}`)

  productCategory = JSON.stringify(productCategory)

  productCategory = JSON.parse(productCategory)

  return productCategory
}

export default deleteProductCategory