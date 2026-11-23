const models = require('../models')
const authService = require('../auth')

const login = async (req, res, next) => {
  const { email, password } = req.body ?? {}
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(401).json({ error: 'Login failure' })
  }

  const user = await models.User.findOne({
    where: { email, password }
  })

  if (!user) return res.status(401).json({ error: 'Login failure' })

  const accessToken = authService.signToken(user.id)
  res.json({ accessToken, user })
}

module.exports = {
  login
}
