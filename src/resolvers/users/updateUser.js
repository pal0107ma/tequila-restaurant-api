import client from '../../db/redis.client.js'
import User from '../../models/User.js'
import { GraphQLError } from 'graphql'
import Joi from 'joi'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'
import sendEmail from '../../helpers/sendEmail.js'
import passwordSchema from '../../schemas/passwordSchema.js'

async function updateUser (__, args, context) {
  const schema = Joi.object({
    phoneNr: Joi.string().alphanum().min(3).max(15).optional().empty(null),

    firstName: Joi.string()
      .min(3)
      .max(30)
      .regex(/^[A-Z]+$/i).optional().empty(null),

    lastName: Joi.string()
      .min(3)
      .max(30)
      .regex(/^[A-Z]+$/i).optional().empty(null),

    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ['com', 'net'] }
    }).optional().empty(null),

    security: Joi.string().when('password', {
      is: Joi.any().valid(null),
      then: Joi.when('email', {
        is: Joi.any().valid(null),
        then: Joi.optional().empty(null),
        otherwise: Joi.required()
      }),
      otherwise: Joi.required()
    }),

    password: passwordSchema
  })

  const { error, value: { email, security, password, ...update } } = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  // VERIFY IF EMAIL ALREADY IN USE
  if (email && email !== context.user.email) {
    const user = await User.findOne({ email })

    if (user) {
      throw new GraphQLError('email already in use', {
        extensions: {
          code: 'BAD_USER_INPUT',
          http: { status: 409 }
        }
      })
    }
  }

  // FIND USER AND UPDATE
  let user = await User.findByIdAndUpdate(context.user._id, update)

  // IF DOES NOT EXIST
  if (!user) return null

  // IF EMAIL WAS UPDATED
  if ((email && email !== context.user.email) || password) {
    // VALIDATE SECURITY
    const validPass = bcrypt.compareSync(security, user.password)

    if (!validPass) {
      throw new GraphQLError('password in not correct', {
        extensions: {
          code: 'BAD_USER_INPUT',
          http: { status: 400 }
        }
      })
    }

    // CHANGE EMAIL
    if (email) {
      user.email = email

      user.accountConfirmed = false

      user.tokens.forEach(async ({ t }) => {
        await client.del(`jwt:${t}`)
      })

      user.tokens = [{ }]

      // SEND EMAIL

      await sendEmail({
        htmlParams: {
          HREF: `${
            process.env.FRONTEND_URL || 'http://localhost:5050/auth'
          }/confirm-account?t=${user.tokens[0].t}`,
          TITLE: "Let's confirm your new email!",
          LINK_TEXT: 'Click here!',
          TEXT: 'We need you confirm your new email let\'s press "Click here!"'
        },
        to: [email],
        subject: 'Confirm your new email'
      })
    }

    // CHANGE PASSWORD
    if (password) {
      user.password = bcrypt.hashSync(password, 10)
    }

    await user.save()
  }

  user = JSON.stringify({ ...(({ tokens, ...user }) => user)(user._doc), ...update })

  // UPDATE IN REDIS
  await client.del(`users:${context.user._id}`)

  await client.set(`users:${context.user._id}`, user, {
    EX: process.env.USER_REDIS_EXP
      ? Number(process.env.USER_REDIS_EXP)
      : 60 * 60 * 24,
    NX: true
  })

  // SEND USER DATA
  return JSON.parse(user)
}

export default updateUser
