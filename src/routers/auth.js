import { Router } from 'express'

import signup from '../controllers/auth/signup.js'
import signin from '../controllers/auth/signin.js'
import confirmAccount from '../controllers/auth/confirmAccount.js'
import logout from '../controllers/auth/logout.js'
import forgotPassword from '../controllers/auth/forgotPassword.js'
import confirmForgotPassword from '../controllers/auth/confirmForgotPassword.js'
import verifyUUIDToken from '../middlewares/auth/verifyUUIDToken.js'
import verifyJWT from '../middlewares/auth/verifyJWT.js'

const router = Router()

router.post('/signup', signup)

router.post('/signin', signin)

router.get('/confirm-account', verifyUUIDToken,  confirmAccount)

router.delete('/logout', verifyJWT, logout)

router.post('/forgot-password', forgotPassword)

router.get('/confirm-forgot-password', verifyUUIDToken, (req, res) => res.json({ ok: true }))

router.post('/confirm-forgot-password', verifyUUIDToken, confirmForgotPassword)

export default router
