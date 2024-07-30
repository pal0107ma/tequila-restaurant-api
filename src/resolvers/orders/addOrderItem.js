import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import Order from "../../models/Order.js"
import BranchOffice from "../../models/BranchOffice.js"
import Restaurant from "../../models/Restaurant.js"
import client from "../../db/redis.client.js"
import Joi from "joi"
import Recipe from "../../models/Recipe.js"
import InventoryEntry from "../../models/InventoryEntry.js"
import fillInventoryEntriesOuts from "../../helpers/fillInventoryEntriesOuts.js"

async function addOrderItem(__, args,context) {

  const schema = Joi.object().keys({
    orderId: idSchema,
    recipeId: idSchema,
    quantity: Joi.number().min(1),
  })

  const { error, value: { orderId, quantity: orderQuantity,recipeId }} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  let order = await Order.findById(orderId)

  if(!order) {
      throw new GraphQLError('order was not found', {
      extensions: {
        code: 'ORDER_NOT_FOUND',
        http: { status: 409 }
      }
    })
  }

  const recipe = await Recipe.findById(recipeId)

  if(!recipe) {
    throw new GraphQLError('recipe was not found', {
      extensions: {
        code: 'RECIPE_NOT_FOUND',
        http: { status: 409 }
      }
    })
  }

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

  if (`${order.branchId}`!==`${recipe.branchId}`) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'RECIPE_ACCESS_DENIED',
        http: { status: 403 }
      }
    })
  }

  const orderItem = order.items.find((doc)=> `${doc.recipeId}` === recipeId)

  if(orderItem) {
    throw new GraphQLError('similar item already has the same recipe id', {
      extensions: {
        code: 'PRODUCT_ALREADY_ADDED',
        http: { status: 409 }
      }
    })
  }


  let totalOrderItemPrice = 0

  const toUpdate = []

  for (let i = 0; i < recipe.items.length; i++) {
    const {productId, quantity: productContentQuantity} = recipe.items[i];
    

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

    let totalProductContent = (productContentQuantity / recipe.portions) * orderQuantity

    const {fiat} = await fillInventoryEntriesOuts({inventoryEntries, totalProductContent, toUpdate, avoidUpdate: true})

    totalOrderItemPrice += fiat
  }

  await Promise.all(toUpdate.map((item)=> item.save()))

  order.items.push({quantity: orderQuantity,recipeId, totalPrice: totalOrderItemPrice.toFixed(4)})

  await order.save()

  order = JSON.stringify(order)

  await client.set(`orders:${orderId}`,order,{
    EX: process.env.ORDER_REDIS_EXP
      ? Number(process.env.ORDER_REDIS_EXP)
      : 60 * 60 * 24
  })

  return JSON.parse(order)
}

export default addOrderItem