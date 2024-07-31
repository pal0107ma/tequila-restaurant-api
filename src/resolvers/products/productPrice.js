
import client from "../../db/redis.client.js";
import InventoryEntry from "../../models/InventoryEntry.js";

async function productPrice (parent) {

  if(!parent) return null

  const productId = parent?.productId ?? parent?._id

  let productPrice = await client.get(`product_price:${productId}`)

  if(!productPrice) {
    const inventoryEntries = await InventoryEntry.find({productId}).select('purchasePrice quantity')

    if(!inventoryEntries.length) return null

    productPrice = (inventoryEntries.reduce((acc,{purchasePrice,quantity})=> acc + (purchasePrice / quantity),0) / inventoryEntries.length).toFixed(4)

    await client.set(`product_price:${productId}`,`${productPrice}`)
  }

  return +productPrice
}

export default productPrice