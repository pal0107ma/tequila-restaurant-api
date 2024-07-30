import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import Order from "../../models/Order.js"
import BranchOffice from "../../models/BranchOffice.js"
import Restaurant from "../../models/Restaurant.js"
import client from "../../db/redis.client.js"
import Recipe from "../../models/Recipe.js"
import InventoryEntry from "../../models/InventoryEntry.js"
import emptyInventoryEntriesOuts from "../../helpers/emptyInventoryEntriesOuts.js"

async function deleteOrderItem(__, {id},context) {

  const { error } = idSchema.validate(id)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  let order = await Order.findOne({'items._id': id})

  if(!order) return null

  const branch = await BranchOffice.findById(order.branchId)

  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId
  })

  if (!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'ORDER_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  }

  const recipe = await Recipe.findById(order.items.id(id).recipeId)

  const orderQuantity = order.items.id(id).quantity

  for (let i = 0; i < recipe.items.length; i++) {
    const {productId, quantity: productContentQuantity} = recipe.items[i];
    

    const inventoryEntries =await InventoryEntry
    .find({productId, $where: `return this.outs.reduce((acc,n)=> acc + n,0) === this.totalUnits`,})
    .sort({createdAt: -1})
    .limit(50)
    
    const inventoryEntry = await InventoryEntry.findOne({
      $where: `return this.outs.length && this.outs.reduce((acc,n)=> acc + n,0) < this.totalUnits`,
      productId
    })
    
    if(inventoryEntry) inventoryEntries.unshift(inventoryEntry)

    let totalProductContent = (productContentQuantity / recipe.portions) * orderQuantity

    await emptyInventoryEntriesOuts({inventoryEntries, totalProductContent})
  }

  order.items.pull(id)

  await order.save()

  const orderId = order._id

  order = JSON.stringify(order)

  await client.set(`orders:${orderId}`,order,{
    EX: process.env.ORDER_REDIS_EXP
      ? Number(process.env.ORDER_REDIS_EXP)
      : 60 * 60 * 24
  })

  return JSON.parse(order)
}

export default deleteOrderItem