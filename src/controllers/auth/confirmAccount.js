import Joi from 'joi'

// EXPRESS TYPES
import { response, request } from 'express'

// MODEL
import User from '../../models/User.js'

// HELPERS
import internalErrorServer from '../../helpers/internalErrorServer.js'

const confirmAccount = async (req = request, res = response) => {
  try {
    const {user,t} = req.context

    user.accountConfirmed = true

    // DELETE TOKEN
    user.tokens.pull({ t })

    // SAVE CHANGES
    await user.save()

    // SEND USER INFO
    res.json(
      (({ tokens, accountConfirmed,password,_id, ...user }) => {
        return { msg: 'confirm account success',user:{id:_id,...user} }
      })(user._doc)
    )
  } catch (error) {
    internalErrorServer(error, res)
  }
}

export default confirmAccount
