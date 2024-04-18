import Joi from 'joi'
import { request, response } from 'express'
import internalErrorServer from '../../helpers/internalErrorServer.js'
import User from '../../models/User.js'

const verifyUUIDToken = async (req = request, res = response, next) => {
  try {
    const { error, value: t } = Joi.string().validate(
      req.query.t || ''
    )

    if (error) return res.status(400).json({ msg: 'token is required' })

    const user = await User.findOne({
      'tokens.t': t,
      $where: `var token = this.tokens.find(({ t }) => t === "${t}"); return token?.exp === null || token?.exp > Date.now()`
    })

    if (!user) return res.status(404).json({ msg: 'token was not found' })

    req.context = {
      user,
      t
    }

    next()
  } catch (error) {
    internalErrorServer(error, res)
  }
}

export default verifyUUIDToken
