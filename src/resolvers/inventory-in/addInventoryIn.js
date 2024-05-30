import Product from "../../models/Product.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import InventoryIn from "../../models/InventoryIn.js"

async function addInventoryIn (__, args, context) {

  // VALIDATE USER INPUT
  const schema = Joi.object().keys({
    branchId: idSchema,
    productId: idSchema,
    purchasePrice: Joi.number().min(1),
    quantity: Joi.number().integer().min(1),
  })

  const { error, 
    value: {
      productId,
      purchasePrice,
      quantity
    }
  } = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  // DOES PRODUCT EXIST
  const product = await Product.findById(productId)

  if (!product) {
    throw new GraphQLError('product was not found', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 404 }
      }
    })
  }

  // DOES BRANCH EXIST
  const branch = await BranchOffice.findById(product.branchId)

  // VERIFY ACCESS
  const  restaurant = await Restaurant.findOne({
    _id: branch.restaurantId,
    userId: context.user._id
  })

  if (!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 403 }
      }
    })
  }

  // SAVE MERCHANDISE RECEIPT
  const total = product.contentAmountWeight * product.countableAmount * quantity

  let merchandiseReceipt = new InventoryIn({
    branchId: product.branchId,
    productId,
    purchasePrice,
    quantity,
    total,
    unitCost: purchasePrice / total
  })

  await merchandiseReceipt.save()

  // RETURN DATA

  merchandiseReceipt = JSON.stringify(merchandiseReceipt)

  merchandiseReceipt = JSON.parse(merchandiseReceipt)

  return merchandiseReceipt
}

export default addInventoryIn
