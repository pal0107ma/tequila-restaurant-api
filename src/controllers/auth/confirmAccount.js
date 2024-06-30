import { response, request } from 'express'
import internalErrorServer from '../../helpers/internalErrorServer.js'
import rmSensitive from './helpers/rmSensitive.js'

const confirmAccount = async (req = request, res = response) => {
  try {
    // 1. EXTRACT USER AND TOKEN FROM CONTEXT
    const { user, t } = req.context // Extract user data and token from request context

    // 2. CONFIRM USER ACCOUNT
    user.accountConfirmed = true // Set the accountConfirmed flag to true

    // 3. REMOVE CONFIRMATION TOKEN
    user.tokens.pull({ t }) // Remove the used confirmation token from the user's tokens array

    // 4. SAVE USER CHANGES
    await user.save() // Save the updated user data

    // 5. SEND SUCCESS RESPONSE
    res.json({ msg: 'confirm account success', user: rmSensitive(user) }) // Inform user that account confirmation is successful and send user data (excluding sensitive information)
  } catch (error) {
    internalErrorServer(error, res) // Handle internal server errors with helper function
  }
}

export default confirmAccount
