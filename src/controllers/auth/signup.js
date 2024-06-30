import bcrypt from 'bcrypt'
import Joi from 'joi'
import { response, request } from 'express'
import User from '../../models/User.js'
import BranchInvite from '../../models/BranchInvite.js'
import internalErrorServer from '../../helpers/internalErrorServer.js'
import sendEmail from '../../helpers/sendEmail.js'
import passwordSchema from '../../schemas/passwordSchema.js'
import rmSensitive from './helpers/rmSensitive.js'

const signup = async (req = request, res = response) => {
  try {
    // 1. VALIDATE USER INPUT
    const schema = Joi.object({
      firstName: Joi.string()
        .min(3)
        .max(30)
        .trim()
        .regex(/^[A-Z]+$/i) // Uppercase letters only, can be adjusted based on requirements
        .required(),

      lastName: Joi.string()
        .min(3)
        .max(30)
        .trim()
        .regex(/^[A-Z]+$/i) // Uppercase letters only, can be adjusted based on requirements
        .required(),

      password: passwordSchema.required(), // Use pre-defined password validation schema

      email: Joi.string().email({
        minDomainSegments: 2,
        tlds: { allow: ['com', 'net'] }
      }).required(),
    })

    const { value: input, error } = schema.validate(req.body)

    if (error) {
      return res.status(400).json(error) // Send bad request error with validation details
    }

    // 2. CHECK USER EXISTENCE
    const doesExist = await User.findOne({ email: input.email })

    if (doesExist) {
      return res.status(409).json({ msg: 'email already in use' }) // Send conflict error if email already exists
    }

    // 3. HASH PASSWORD
    input.password = bcrypt.hashSync(input.password, 10) // Hash password before saving the user

    // 4. CREATE USER
    const user = new User({
      ...input,
      tokens: [{ }] // Create an empty array for user tokens
    })

    // 5. ASSIGN USER ROLE (SUPER_ADMIN if none exists)
    const superAdmin = await User.findOne({ userType: 'SUPER_ADMIN' })

    if (!superAdmin) {
      user.userType = 'SUPER_ADMIN' // Assign SUPER_ADMIN role if there's no existing one
    }

    // 6. HANDLE BRANCH INVITES
    const branchInvites = await BranchInvite.find({ userEmail: user.email })

    // Assign branch invites to the user
    user.allowedBranches = branchInvites

    // Delete the used branch invites to avoid duplicates
    await BranchInvite.deleteMany({ userEmail: user.email })

    // 7. SEND CONFIRMATION EMAIL
    await sendEmail({
      htmlParams: {
        HREF: `${
          process.env.FRONTEND_URL || 'http://localhost:5050/auth'
        }/confirm-account?t=${user.tokens[0].t}`, // Confirmation link with token
        TITLE: 'Welcome to El Origen!',
        LINK_TEXT: 'Click here!',
        TEXT: 'We need you confirm your account let\'s press "Click here!"'
      },
      to: [user.email],
      subject: 'Confirm account email'
    })

    // 8. SAVE USER AND SEND RESPONSE
    await user.save()

    res.status(201).json({
      msg: 'signup success',
      user: rmSensitive(user) // Send back user information (excluding sensitive data)
    })
  } catch (error) {
    internalErrorServer(error, res) // Handle internal errors with helper function
  }
}

export default signup
