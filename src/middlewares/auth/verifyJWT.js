import client from '../../db/redis.client.js'
import jwt from 'jsonwebtoken'
import { response, request } from 'express'
import User from '../../models/User.js'
import internalErrorServer from '../../helpers/internalErrorServer.js'

const verifyJWT = async (req = request, res = response, next) => {
  try {
    // 1. CHECK FOR AUTHORIZATION HEADER
    if (
      !req?.headers?.authorization ||
      !req?.headers?.authorization.startsWith('Bearer')
    ) {
      return res.status(401).json({ msg: 'invalid auth' }) // Unauthorized error if no authorization header or invalid format
    }

    // 2. EXTRACT TOKEN FROM HEADER
    const [, t] = req.headers.authorization.split(' ') // Split 'Bearer' and token

    // 3. VERIFY JWT TOKEN
    let decodedToken

    try {
      decodedToken = jwt.verify(t, process.env.JWT_KEY || 'secret') // Verify token with secret
    } catch (error) {
      // Handle specific JWT verification errors
      if (
        error?.message === 'jwt expired' ||
        error?.message === 'invalid token' ||
        error?.message === 'jwt malformed' ||
        error?.message === 'invalid signature'
      ) {
        return res.status(401).json({ msg: 'invalid auth' }) // Unauthorized error for invalid JWT
      }
      throw error // Re-throw other errors for internal server error handling
    }

    const { _id: id } = decodedToken // Extract user ID from decoded token

    // 4. CHECK TOKEN EXISTENCE IN REDIS (optimistic update)
    const redisToken = await client.exists(`jwt:${t}`) // Check if token exists in Redis

    let user

    // 5. HANDLE REDIS TOKEN ABSENCE
    if (!redisToken) {
      // Fetch user data by token from MongoDB (excluding sensitive fields)
      user = await User.findOne({ 'tokens.t': t }).select('-tokens -password -accountConfirmed')

      // User not found (logged out or deleted) - unauthorized error
      if (!user) return res.status(401).json({ msg: 'invalid auth' })

      // Stringify user data and save token to Redis with expiration (using environment variable or default)
      user = JSON.stringify(user)
      await client.set(`jwt:${t}`, t, {
        EX: process.env.JWT_REDIS_EXP ? Number(process.env.JWT_REDIS_EXP) : 60 * 60 * 24
      })
    }

    // 6. HANDLE USER DATA RETRIEVAL (might be needed in both Redis cases)
    if (!user) {
      // Try retrieving user data by ID from Redis
      user = await client.get(`users:${id}`)

      // User not found in Redis - fetch from MongoDB (excluding sensitive fields)
      if (!user) {
        user = await User.findById(id).select('-tokens -password -accountConfirmed')
        // Permanent user deletion - unauthorized error
        if (!user) return res.status(401).json({ msg: 'invalid auth' })

        user = JSON.stringify(user)
        // Save user data to Redis with expiration (using environment variable or default)
        await client.set(`users:${id}`, user, {
          EX: process.env.USER_REDIS_EXP ? Number(process.env.USER_REDIS_EXP) : 60 * 60 * 24
        })
      }
    }

    // 7. SUCCESS
    req.context = {
      user
    }

    next() // Pass control to the next middleware or route handler
  } catch (error) {
    internalErrorServer(error, res) // Handle internal server errors with helper function
  }
}

export default verifyJWT
