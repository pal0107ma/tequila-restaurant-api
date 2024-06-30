import bcrypt from 'bcrypt'
import Joi from 'joi'
import JWT from 'jsonwebtoken'
import { response, request } from 'express'
import client from '../../db/redis.client.js'
import User from '../../models/User.js'
import internalErrorServer from '../../helpers/internalErrorServer.js'
import rmSensitive from './helpers/rmSensitive.js'

const signin = async (req = request, res = response) => {
  try {
    // 1. VALIDATE REQUEST BODY
    const schema = Joi.object({
      password: Joi.string().required().trim().required(), // Required, trimmed password
      email: Joi.string().email({
        minDomainSegments: 2,
        tlds: { allow: ['com', 'net'] }
      }).required() // Required email with validation (min 2 domain segments, allow only .com and .net TLDs)
    })

    const { value, error } = schema.validate(req.body)

    if (error) {
      // Send bad request error with validation details
      return res.status(400).json(error)
    }

    const { email, password } = value

    // 2. CHECK USER EXISTENCE
    // Find a user with the provided email address
    const user = await User.findOne({ email })

    if (!user) {
      // User not found, send not found error with message
      return res
        .status(404)
        .json({ msg: 'does not exist any user with that email' })
    }

    // 3. VERIFY ACCOUNT CONFIRMATION
    if (!user.accountConfirmed) {
      // Account not confirmed, send forbidden error with message
      return res.status(403).json({ msg: 'your account is not confirmed' })
    }

    // 4. VALIDATE PASSWORD
    const validatePassword = bcrypt.compareSync(password, user.password)

    if (!validatePassword) {
      // Password mismatch, send bad request error with message
      return res.status(400).json({ msg: 'password is not correct' })
    }

    // 5. GENERATE JWT
    const jwt = JWT.sign(
      {
        _id: user._id
      },
      process.env.JWT_KEY || 'secret', // Use environment variable or default secret
      { expiresIn: process.env.JWT_EXP || '1d' } // Use environment variable or default expiration (1 day)
    )

    // 6. UPDATE USER TOKENS
    // Filter out expired tokens from the user's existing tokens
    user.tokens = user.tokens.filter(({ exp }) => exp > new Date().getTime())

    // Create a new token object with details (token, expiration, issued at, and type)
    let { exp, iat } = JWT.decode(jwt)
    exp *= 1000
    iat *= 1000
    user.tokens.push({
      t: jwt,
      exp,
      iat,
      type: 'JWT'
    })

    // Save the updated user data (including tokens)
    await user.save()

    // 7. CACHE DATA IN REDIS
    // Cache the JWT in Redis with expiration (using environment variable or default)
    await client.set(`jwt:${jwt}`, jwt, {
      EX: process.env.JWT_REDIS_EXP ? Number(process.env.JWT_REDIS_EXP) : 60 * 60 * 24
    })

    // Cache the user object in Redis with expiration (using environment variable or default)
    await client.set(
      `users:${user._doc.id}`,
      JSON.stringify(user),
      {
        EX: process.env.USER_REDIS_EXP ? Number(process.env.USER_REDIS_EXP) : 60 * 60 * 24
      }
    )

    // 8. SEND RESPONSE
    res.json({ msg: 'signin success', jwt, user: rmSensitive(user) }) // Send success message, JWT, and user data
  } catch (error) {
    internalErrorServer(error, res) // Handle internal errors with helper function
  }
}

export default signin
