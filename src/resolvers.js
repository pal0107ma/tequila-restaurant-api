import userProfile from './resolvers/users/userProfile.js'
import updateUser from './resolvers/users/updateUser.js'

const resolvers = {
  User: {
    id: (parent) => parent.id ?? parent._id
  },
  Query: {
    userProfile
  },
  Mutation: {
    updateUser
  }
}

export default resolvers
