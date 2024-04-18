import client from '../../db/redis.client.js'
import User from '../../models/User.js'
import { GraphQLError } from 'graphql'
import idSchema from '../../schemas/idSchema.js'
async function userProfile (__, args, context) {
  // IF USER IS NOT LOOKING FOR OTHER USER PROFILE
  if (!args?.id) return context.user

  // VALIDATE ID ARGUMENT
  const { error, value: id } = idSchema.validate(args?.id || '')

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  let user = await client.get(`users:${id}`)

  // IS IN REDIS
  if (user) return JSON.parse(user)

  // IS NOT IN REDIS
  user = await User.findById(id).select('-tokens')

  if (!user) return null

  user = JSON.stringify(user)

  // SAVE TO REDIS
  await client.set(`users:${id}`, user, {
    EX: process.env.USER_REDIS_EXP
      ? Number(process.env.USER_REDIS_EXP)
      : 60 * 60 * 24,
    NX: true
  })

  return JSON.parse(user)
}

export default userProfile
