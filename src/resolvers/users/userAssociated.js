import Restaurant from "../../models/Restaurant.js";

async function userAssociated(parent) {
  const restaurants = await Restaurant.find({ userId: parent._id })

  return restaurants.length ? true : false
}

export default userAssociated