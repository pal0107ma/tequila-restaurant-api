import { response, request } from 'express'
import client from '../../db/redis.client.js'
import User from '../../models/User.js'
import internalErrorServer from '../../helpers/internalErrorServer.js'
import rmSensitive from './helpers/rmSensitive.js'

const logout = async (req = request, res = response) => {
  try {
    // 1. EXTRACT USER ID AND TOKEN FROM CONTEXT
    const { userId, t } = req.context // Extract user ID and token from request context

    // 2. DELETE TOKENS FROM REDIS CACHE
    // Delete the JWT token from Redis
    await client.del(`jwt:${t}`)

    // Delete the user data from Redis (prevents sending potentially outdated data)
    await client.del(`users:${userId}`)

    // 3. FETCH USER DATA FROM MONGOOSE (EXCLUDING SENSITIVE FIELDS)
    const user = await User.findById(userId).select('-accountConfirmed -password')

    // 4. HANDLE USER DELETION (UNAUTHORIZED IF USER DOES NOT EXIST)
    if (!user) {
      return res.status(401).json({ msg: 'invalid auth' }) // Unauthorized error if user not found
    }

    // 5. REMOVE LOGGED OUT TOKEN FROM USER'S TOKENS ARRAY
    const updatedTokens = user.tokens.filter((token) => token.t !== t) // Filter out the logged out token
    user.tokens = updatedTokens

    // 6. SAVE UPDATED USER DATA
    await user.save()

    // 7. SEND SUCCESS RESPONSE (USER DATA WITHOUT SENSITIVE FIELDS)
    res.json({ msg: 'logout success', user: rmSensitive(user) })
  } catch (error) {
    internalErrorServer(error, res) // Handle internal server errors with helper function
  }
}

export default logout
