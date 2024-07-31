

function onlySuperAdmin(req = express.request, res = express.response, next) {

  const {user} = req.context

  if(user.userType ==='SUPER_ADMIN') return next()

  res.status(403).json({msg: 'access denied'})
}

export default onlySuperAdmin