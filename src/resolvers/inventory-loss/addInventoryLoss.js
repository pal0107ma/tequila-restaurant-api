// Import necessary models and modules
import Product from "../../models/Product.js"
import Restaurant from "../../models/Restaurant.js"
import BranchOffice from "../../models/BranchOffice.js"
import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import InventoryEntry from "../../models/InventoryEntry.js"
import InventoryLoss from "../../models/InventoryLoss.js"
import fillInventoryEntriesOuts from "../../helpers/fillInventoryEntriesOuts.js"

async function addInventoryLoss (__,args, context) {

  const schema = Joi.object().keys({
    productId: idSchema,
    quantity: Joi.number().greater(0)
  })

   const { error,
    value: {
      productId,
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

  const product = await Product.findById(productId)

  if (!product) {
    throw new GraphQLError('product was not found', {
      extensions: {
        code: 'PRODUCT_NOT_FOUND',
        http: { status: 409 }
      }
    })
  }

  const branch = await BranchOffice.findById(product.branchId)

  const restaurant = await Restaurant.findOne({
    _id: branch.restaurantId,
    userId: context.user._id
  })

  if (!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'PRODUCT_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  } 

  const inventoryEntries =await InventoryEntry
    .find({productId, $where: `return !this.outs.length`,})
    .sort({createdAt: 1})
    .limit(50)
    
  const inventoryEntry = await InventoryEntry.findOne({
    $where: `return this.outs.length && this.outs.reduce((acc,n)=> acc + n,0) < this.totalUnits`,
    productId
  })
  
  if(inventoryEntry) inventoryEntries.unshift(inventoryEntry)

  if(!inventoryEntries.length && !inventoryEntry) {
    
    throw new GraphQLError('there are not enough in store', {
      extensions: {
        code: 'NOT_IN_STORE',
        http: { status: 409 }
      }
    })
  }

  const {fiat: cost} = await fillInventoryEntriesOuts({inventoryEntries, totalProductContent: quantity})

  const inventoryLoss = new InventoryLoss({productId,quantity, branchId: product.branchId, cost})

  await inventoryLoss.save()

  return JSON.parse(JSON.stringify(inventoryLoss))
}

export default addInventoryLoss