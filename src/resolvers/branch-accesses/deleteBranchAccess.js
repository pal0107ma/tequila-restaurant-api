import Restaurant from "../../models/Restaurant.js";
import User from "../../models/User.js";
import BranchOffice from "../../models/BranchOffice.js";
import idSchema from "../../schemas/idSchema.js";
import client from "../../db/redis.client.js";

async function deleteBranchAccess (__, {id}, context) {

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

  const restaurants = await Restaurant.find({ userId: context.user._id })

  const branchOffices = await BranchOffice.find({
    restaurantId: { $in: restaurants.map(({_id}) =>_id) }
  })

  let user = await User.findOne({
    'allowedBranches.branchId': { $in: branchOffices.map(({_id}) =>_id) },
    'allowedBranches._id': id
  }, 
).select('-confirmedAccount -password -tokens')

  if(!user) return null

  user.allowedBranches.pull(id)

  await user.save()

  const userId = user._id

  user = JSON.stringify(user)

  // UPDATE IN REDIS
  await client.del(`users:${userId}`)

  await client.set(`users:${userId}`, user, {
    EX: process.env.USER_REDIS_EXP
      ? Number(process.env.USER_REDIS_EXP)
      : 60 * 60 * 24,
    NX: true
  })

  user = JSON.parse(user)

  return user
}

export default deleteBranchAccess