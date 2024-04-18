import { request, response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import internalErrorServer from '../../helpers/internalErrorServer.js'
import emailSchema from '../../schemas/emailSchema.js'
import User from '../../models/User.js'
import sendEmail from '../../helpers/sendEmail.js'

const forgotPassword = async (req = request, res = response) => {
  try {
    const { error, value: email } = emailSchema.validate(req.body.email || '')

    if (error) return res.status(400).json(error)

    const user = await User.findOne({ email }).select('tokens')

    if (!user) return res.status(404).json({ msg: 'user was not found' })

    const iat = new Date().getTime()

    const time = process.env.FORGOT_PASSWORD_TOKEN_EXP || 24 * 60 * 60 * 1000

    const exp = time + iat

    user.tokens.forEach(({ type, _id }) => {
      if (type === 'FORGOT-PASS') user.tokens.pull(_id)
    })

    user.tokens.push({
      exp, iat, type: 'FORGOT-PASS'
    })

    await user.save()

    // SEND CONFIRMATION EMAIL

    await sendEmail({
      htmlParams: {
        HREF: `${process.env.FRONTEND_URL}/confirm-forgot-password?t=${user.tokens.slice(-1)[0].t}`,
        TITLE: 'Confirm you forgot your password!',
        LINK_TEXT: 'Click here!',
        TEXT: 'We need you confirm you forgot your password let\'s press "Click here!". This link will expire in next 24 hours.'
      },
      to: [email],
      subject: 'Forgot password confirmation'
    })

    // SEND USER INFO

    res.status(201).json({ msg: "we've you sent an email" })
  } catch (error) {
    internalErrorServer(error, res)
  }
}

export default forgotPassword
