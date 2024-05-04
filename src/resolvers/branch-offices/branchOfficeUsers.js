
function branchOfficeUsers ({users,_id: branchId}) {

  return users.map(({_id: userId, allowedBranches}) => {

    const {  branchRole, _id: id} = allowedBranches.find((obj) => branchId ===  obj.branchId)

    return {
      userId,
      id,
      branchRole
    }
  })
}

export default branchOfficeUsers