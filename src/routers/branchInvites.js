import { Router, request, response } from "express";
import Joi from "joi";
import User from "../models/User.js";
import BranchInvite from "../models/BranchInvite.js";
import client from "../db/redis.client.js";
import internalErrorServer from "../helpers/internalErrorServer.js";

const router = Router()

router.get('/', async (req = request, res = response)=> {
  try {
    // VALIDATE USER INPUT

    const schema = Joi.object().keys({
      t: Joi.string().required()
    })
  
    const { error, value: {t} } = schema.validate(req.query)
  
    if (error) return res.status(400).json(error)
  
    // VERIFY BRANCH INVITE ALREADY EXISTS

    const branchInvite  = await BranchInvite.findOne({t})
  
    if(!branchInvite) return res.status(404).json({msg:'branch invite was not found'})
  
    // VERIFY USER ALREADY EXISTS

    const user = await User.findOne({email: branchInvite.userEmail})
    .select('-tokens -accountConfirmed -password')
  
    if(!user) return res.status(300).json({msg: 'please signup first'})
  
    // ADD BRANCH ACCESS

    user.allowedBranches.push(branchInvite)
  
    await user.save()

    await BranchInvite.deleteOne({t})
  
    // UPDATE IN REDIS
    await client.del(`users:${user._id}`)
  
    await client.set(`users:${user._id}`, JSON.stringify(user), {
      EX: process.env.USER_REDIS_EXP
        ? Number(process.env.USER_REDIS_EXP)
        : 60 * 60 * 24,
      NX: true
    })

    await client.del(`branch_offices:${branchInvite.branchId}`)
  
    // SEND USER DATA
    res.status(200).json({
      msg: 'confirm branch invite success',
      user:(({ allowedBranches,_id:id, ...user }) => {
        return { 
          id,
          allowedBranches: allowedBranches.map(({ _doc:{_id:id, ...rest} }) => {
            return { id,...rest }
          }),
          ...user
        }
      })(user._doc)
    })
  
  } catch (error) {
    internalErrorServer(error, res)
  }
})

export default router