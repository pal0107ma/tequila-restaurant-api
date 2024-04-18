import bcrypt from 'bcrypt'
import Joi from 'joi'
import JWT from 'jsonwebtoken'

// REDIS CLIENT
import { response, request } from 'express'
import client from '../../db/redis.client.js'

// EXPRESS TYPES

// MODEL
import User from '../../models/User.js'

// HELPERS
import internalErrorServer from '../../helpers/internalErrorServer.js'

// VALIDATION SCHEMA

const schema = Joi.object({
  password: Joi.string().required().trim(),
  email: Joi.string().email({
    minDomainSegments: 2,
    tlds: { allow: ['com', 'net'] }
  })
})

const signin = async (req = request, res = response) => {
  try {
    // GRAB DATA FROM BODY
    const { email = '', password = '' } = req.body

    // VALIDATE DATA
    const { value, error } = schema.validate({
      email,
      password
    })

    if (error) return res.status(400).json(error)

    // VERIFY IF DOES NOT EXIST ANY USER WITH SAME EMAIL
    const user = await User.findOne({ email })

    if (!user) {
      return res
        .status(404)
        .json({ msg: 'does not exist any user with that email' })
    }

    // VERIFY IF ACCOUNT IS CONFIRMED
    if (!user.accountConfirmed) { return res.status(403).json({ msg: 'your account is not confirmed' }) }

    // VALIDATE PASSWORD
    const validatePassword = bcrypt.compareSync(value.password, user.password)

    if (!validatePassword) { return res.status(400).json({ msg: 'password in not correct' }) }

    // GENERATE JSON WEB TOKEN

    const jwt = JWT.sign(
      {
        _id: user._id
      },
      process.env.JWT_KEY || 'secret',
      { expiresIn: process.env.JWT_EXP || '1d' }
    )

    // PULL EXPIRED TOKENS
    user.tokens = user.tokens.filter(({ exp }) => exp > new Date().getTime())

    // PUSH TOKEN TO USER TOKENS

    let { exp, iat } = JWT.decode(jwt)

    exp *= 1000

    iat *= 1000

    user.tokens.push({
      t: jwt, exp, iat, type: 'JWT'
    })

    await user.save()

    // SAVE JWT IN REDIS COLLECTION
    await client.set(`jwt:${jwt}`, jwt, {
      EX: process.env.JWT_REDIS_EXP
        ? Number(process.env.JWT_REDIS_EXP)
        : 60 * 60 * 24,
      NX: true
    })

    // SAVE USER IN REDIS COLLECTION
    await client.set(
      `users:${user._id}`,
      JSON.stringify(user),
      {
        EX: process.env.USER_REDIS_EXP
          ? Number(process.env.USER_REDIS_EXP)
          : 60 * 60 * 24,
        NX: true
      }
    )

    // SEND TOKEN
    res.json({ msg: 'signin success', jwt, user: (({password, tokens, accountConfirmed,_id,...user})=>{
      return {id: _id,...user} 
    })(user._doc) })
  } catch (error) {
    internalErrorServer(error, res)
  }
}

export default signin
