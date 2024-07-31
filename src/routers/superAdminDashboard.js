import { Router, request, response } from 'express'
import Restaurant from '../models/Restaurant.js'
import BranchOffice from '../models/BranchOffice.js'
import internalErrorServer from '../helpers/internalErrorServer.js'

const router = Router()

router.get('/restaurants',async (req= request, res =response) => {
  try {
    const count = await Restaurant.countDocuments({})

    res.json({count})

  } catch (error) {
    internalErrorServer(error, res)
  }
})

router.get('/branches',async (req= request, res =response) => {
  try {
    const count = await BranchOffice.countDocuments({})
  
    res.json({count})
  } catch (error) {
    internalErrorServer(error, res)
  }
})

export default router