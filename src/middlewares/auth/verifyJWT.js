import client from '../../db/redis.client.js'
import jwt from 'jsonwebtoken'

// EXPRESS TYPES
import { response, request } from 'express'

// MODEL
import User from '../../models/User.js'

// VALIDATION SCHEMA

// HELPERS
import internalErrorServer from '../../helpers/internalErrorServer.js'

const verifyJWT = async (req = request, res = response, next) => {
  try {
    if (
      !req?.headers?.authorization ||
      !req?.headers?.authorization.startsWith('Bearer')
    ) { return res.status(401).json({ msg: 'invalid auth' }) }

    // GRAB TOKEN FROM HEADERS
    const [, t] = req.headers.authorization.split(' ')

    // VERIFY JWT
    const {
      _id: id
    } = jwt.verify(t, process.env.JWT_KEY || 'secret')

    // ===============================
    // TOKEN IS VALID >>>
    // ===============================

    // VERIFY IF TOKEN WAS NOT DELETED FROM REDIS COLLECTION
    const redisToken = await client.exists(`jwt:${t}`)

    let user

    // IF TOKEN WAS DELETED FROM REDIS COLLECTION
    if (!redisToken) {
      // FIND USER BY TOKEN
      user = await User.findOne({ 'tokens.t': t })

      // IF USER LOGGED OUT OR USER WAS DELETED
      if (!user) return res.status(401).json({ msg: 'invalid auth' })

      // STRINGIFY USER DATA BUT EXCLUDE TOKENS
      user = JSON.stringify((({ tokens, ...user }) => user)(user._doc))

      // SAVE JWT IN REDIS COLLECTION
      await client.set(`jwt:${t}`, t, {
        EX: process.env.JWT_REDIS_EXP
          ? Number(process.env.JWT_REDIS_EXP)
          : 60 * 60 * 24,
        NX: true
      })
    }

    // _ IF TOKEN EXISTS IN REDIS BUT WE DIDN'T GET USER YET
    // _ OR WE DID'T GET USER EITHER
    if (!user) {
      user = await client.get(`users:${id}`)

      // IF USER DOES NOT EXIST IN REDIS
      if (!user) {
        user = await User.findById(id).select('-tokens')

        // IF USER WAS DELETED PERMANENTLY
        if (!user) return res.status(401).json({ msg: 'invalid auth' })

        user = JSON.stringify(user)

        // SAVE TO REDIS
        await client.set(`users:${id}`, user, {
          EX: process.env.USER_REDIS_EXP
            ? Number(process.env.USER_REDIS_EXP)
            : 60 * 60 * 24,
          NX: true
        })
      };
    }

    // SUCCESS
    req.context = {
      user: JSON.parse(user)
    }

    next()
  } catch (error) {
    if (
      error?.message === 'jwt expired' ||
      error?.message === 'invalid token' ||
      error?.message === 'jwt malformed' ||
      error?.message === 'invalid signature'
    ) { return res.status(401).json({ msg: 'invalid auth' }) }

    internalErrorServer(error, res)
  }
}

export default verifyJWT
