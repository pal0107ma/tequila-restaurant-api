import { request, response } from 'express'
import internalErrorServer from '../../helpers/internalErrorServer.js'
import emailSchema from '../../schemas/emailSchema.js' // Schema for email validation
import User from '../../models/User.js' // User model for database interaction
import sendEmail from '../../helpers/sendEmail.js' // Helper function for sending emails

const forgotPassword = async (req = request, res = response) => {
  try {
    // 1. VALIDATE EMAIL
    const { error, value: email } = emailSchema.validate(req.body.email || '') // Validate email format

    if (error) {
      return res.status(400).json(error) // Send bad request error with validation details
    }

    // 2. FIND USER BY EMAIL
    const user = await User.findOne({ email }).select('tokens') // Find user with the provided email (selecting only tokens field)

    // 3. HANDLE USER NOT FOUND
    if (!user) {
      return res.status(404).json({ msg: 'user was not found' }) // Send not found error if user doesn't exist
    }

    // 4. GENERATE FORGOT PASSWORD TOKEN
    const iat = new Date().getTime() // Issued at timestamp
    const time = process.env.FORGOT_PASSWORD_TOKEN_EXP || 24 * 60 * 60 * 1000 // Token expiration time (default 24 hours)
    const exp = time + iat // Expiration timestamp

    // 5. REMOVE EXISTING FORGOT PASSWORD TOKENS
    user.tokens.forEach(({ type, _id }) => {
      if (type === 'FORGOT-PASS') {
        user.tokens.pull(_id) // Remove any existing forgot password tokens
      }
    })

    // 6. CREATE AND ADD FORGOT PASSWORD TOKEN
    user.tokens.push({
      exp,
      iat,
      type: 'FORGOT-PASS' // Token type for identification
    })

    // 7. SAVE USER WITH UPDATED TOKENS
    await user.save() // Save the user with the new forgot password token

    // 8. SEND FORGOT PASSWORD CONFIRMATION EMAIL
    await sendEmail({
      htmlParams: {
        HREF: `${process.env.FRONTEND_URL}/confirm-forgot-password?t=${user.tokens.slice(-1)[0].t}`, // Link to confirm password reset with the latest token
        TITLE: 'Confirm you forgot your password!',
        LINK_TEXT: 'Click here!',
        TEXT: 'We need you confirm you forgot your password let\'s press "Click here!". This link will expire in next 24 hours.'
      },
      to: [email],
      subject: 'Forgot password confirmation'
    })

    // 9. SEND SUCCESS RESPONSE (without sensitive information)
    res.status(201).json({ msg: "we've sent you an email" }) // Inform user that an email has been sent
  } catch (error) {
    internalErrorServer(error, res) // Handle internal server errors with helper function
  }
}

export default forgotPassword
