
function branchOfficeUser ({users,_id:branchId},{id}) {
  const user = users.find(({allowedBranches}) => allowedBranches.some(({_id})=> id === _id))

  if(!user) return null

  const {  branchRole, _id} = user.allowedBranches.find((obj) => branchId ===  obj.branchId)

  return {
    userId: user._id,
    id: _id,
    branchRole
  }

}

export default branchOfficeUser