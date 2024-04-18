import { response } from 'express'

const internalErrorServer = (error, res = response) => {
  res.status(500).json(error)

  console.log(error)
}

export default internalErrorServer
