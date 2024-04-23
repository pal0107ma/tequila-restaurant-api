import bcrypt from 'bcrypt'
import Joi from 'joi'

// EXPRESS TYPES
import { response, request } from 'express'

// MODEL
import User from '../../models/User.js'

// HELPERS
import internalErrorServer from '../../helpers/internalErrorServer.js'
import sendEmail from '../../helpers/sendEmail.js'

// JOI SCHEMAS
import passwordSchema from '../../schemas/passwordSchema.js'

const signup = async (req = request, res = response) => {
  // VALIDATION SCHEMA
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(15)
      .required(),

    firstName: Joi.string()
      .min(3)
      .max(30)
      .regex(/^[A-Z]+$/i),

    lastName: Joi.string()
      .min(3)
      .max(30)
      .regex(/^[A-Z]+$/i),

    password: passwordSchema,

    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ['com', 'net'] }
    }),
  })

  try {
    // GRAB DATA FROM BODY
    const {
      email = '',
      password = '',
      firstName = '',
      username = '',
      lastName = '',
    } = req.body

    // VALIDATE DATA
    const { value, error } = schema.validate({
      email,
      password,
      username,
      lastName,
      firstName
    })

    if (error) return res.status(400).json(error)

    // VERIFY IF DOES NOT EXIST ANY USER WITH SAME EMAIL OR USERNAME
    const doesExist = await User.findOne({ $or: [{ email }, { username }] })

    if (doesExist) { return res.status(409).json({ msg: 'email or username already in use' }) }

    // HASH PASSWORD BEFORE CREATE USER
    value.password = bcrypt.hashSync(value.password, 10)

    // CREATE USER
    const user = new User({
      ...value,
      tokens: [{ }]
    })

    // ASSIGN ROLE

    const superAdmin = await User.findOne({ role: 'SUPER-ADMIN'})

    if(!superAdmin) {
      user.role = 'SUPER-ADMIN'
    }

    // SAVE

    await user.save()

    // SEND CONFIRMATION EMAIL

    await sendEmail({
      htmlParams: {
        HREF: `${
          process.env.FRONTEND_URL || 'http://localhost:5050/auth'
        }/confirm-account?t=${user.tokens[0].t}`,
        TITLE: 'Welcome to Backlearners!',
        LINK_TEXT: 'Click here!',
        TEXT: 'We need you confirm your account let\'s press "Click here!"'
      },
      to: [email],
      subject: 'Confirm account email'
    })

    // SEND USER INFO
    res.status(201).json({
      msg: 'signup success',
      user:(({ password, tokens, accountConfirmed,_id, ...user }) => {
        return{id:_id,...user}
      })(user._doc)
    })
  } catch (error) {
    internalErrorServer(error, res)
  }
}

export default signup
