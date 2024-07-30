import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import Order from "../../models/Order.js"
import BranchOffice from "../../models/BranchOffice.js"
import Restaurant from "../../models/Restaurant.js"
import client from "../../db/redis.client.js"
import Recipe from "../../models/Recipe.js"
import InventoryEntry from "../../models/InventoryEntry.js"
import fillInventoryEntriesOuts from "../../helpers/fillInventoryEntriesOuts.js"
import emptyInventoryEntriesOuts from "../../helpers/emptyInventoryEntriesOuts.js"
import Joi from "joi"

async function updateOrderItem(__, args,context) {

  const schema = Joi.object().keys({
    id: idSchema,
    quantity: Joi.number().min(1),
  })

  const { error, value: { id, quantity: newQuantity }} = schema.validate(args)

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
  
  const orderQuantity = order.items.id(id).quantity
  
  if(newQuantity === orderQuantity) return JSON.parse(JSON.stringify(order))

  const recipe = await Recipe.findById(order.items.id(id).recipeId)

  const toUpdate = []

  for (let i = 0; i < recipe.items.length; i++) {
    const {productId, quantity: productContentQuantity} = recipe.items[i];
    
    const inventoryEntries =await InventoryEntry
    .find({productId, $where: orderQuantity > newQuantity ?
      `return this.outs.reduce((acc,n)=> acc + n,0) === this.totalUnits`: 
      `return !this.outs.length`,})
    .sort({createdAt: orderQuantity > newQuantity?-1:1})
    .limit(50)
    
    const inventoryEntry = await InventoryEntry.findOne({
      $where: `return this.outs.length && this.outs.reduce((acc,n)=> acc + n,0) < this.totalUnits`,
      productId
    })
    
    if(inventoryEntry) inventoryEntries.unshift(inventoryEntry)

    let totalProductContent = (productContentQuantity / recipe.portions) * Math.abs(newQuantity - orderQuantity)

    if(newQuantity > orderQuantity) {
      const {fiat} = await fillInventoryEntriesOuts({inventoryEntries, totalProductContent, toUpdate, avoidUpdate: true})

      order.items.id(id).totalPrice += fiat
    } else {
      const {fiat} = await emptyInventoryEntriesOuts({inventoryEntries, totalProductContent, toUpdate, avoidUpdate: true})

      order.items.id(id).totalPrice -= fiat
    }

  }

  await Promise.all(toUpdate.map((item)=> item.save()))

  order.items.id(id).totalPrice = order.items.id(id).totalPrice.toFixed(4)

  order.items.id(id).quantity = newQuantity

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

export default updateOrderItem