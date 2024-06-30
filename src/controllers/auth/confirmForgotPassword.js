import { request, response } from 'express'
import bcrypt from 'bcrypt'
import internalErrorServer from '../../helpers/internalErrorServer.js'
import passwordSchema from '../../schemas/passwordSchema.js'

const confirmForgotPassword = async (req = request, res = response) => {
  try {
    // 1. EXTRACT USER AND TOKEN FROM CONTEXT
    const { user, t } = req.context // Extract user data and token from request context

    // 2. VALIDATE NEW PASSWORD
    const { error, value: password } = passwordSchema.validate(req.body.password || '') // Validate new password format

    if (error) {
      return res.status(400).json(error) // Send bad request error with validation details
    }

    // 3. REMOVE FORGOT PASSWORD TOKEN
    user.tokens.pull({ t }) // Remove the used forgot password token from the user's tokens array

    // 4. HASH THE NEW PASSWORD
    user.password = bcrypt.hashSync(password, 10) // Hash the new password before saving

    // 5. SAVE USER WITH UPDATED PASSWORD
    await user.save() // Save the user with the new password

    // 6. SEND SUCCESS RESPONSE
    res.json({ msg: 'confirm forgot password success' }) // Inform user that password reset is successful
  } catch (error) {
    internalErrorServer(error, res) // Handle internal server errors with helper function
  }
}

export default confirmForgotPassword
