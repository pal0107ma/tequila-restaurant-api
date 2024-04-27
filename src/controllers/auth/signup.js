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
  try {

    // VALIDATION SCHEMA
    const schema = Joi.object({
      firstName: Joi.string()
        .min(3)
        .max(30)
        .trim()
        .regex(/^[A-Z]+$/i).required(),

      lastName: Joi.string()
        .min(3)
        .max(30)
        .trim()
        .regex(/^[A-Z]+$/i).required(),

      password: passwordSchema.required(),

      email: Joi.string().email({
        minDomainSegments: 2,
        tlds: { allow: ['com', 'net'] }
      }).required(),
    })

    // VALIDATE DATA
    const { value: input, error } = schema.validate(req.body)

    if (error) return res.status(400).json(error)

    // VERIFY IF DOES NOT EXIST ANY USER WITH SAME EMAIL OR USERNAME
    const doesExist = await User.findOne({ email: input.email })

    if (doesExist) { return res.status(409).json({ msg: 'email already in use' }) }

    // HASH PASSWORD BEFORE CREATE USER
    input.password = bcrypt.hashSync(input.password, 10)

    // CREATE USER
    const user = new User({
      ...input,
      tokens: [{ }]
    })

    // ASSIGN ROLE

    const superAdmin = await User.findOne({ userType: 'SUPER_ADMIN'})

    if(!superAdmin) {
      user.userType = 'SUPER_ADMIN'
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
      to: [user.email],
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
