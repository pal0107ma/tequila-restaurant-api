// ENVIROMENT VARIABLES CONFIG
import * as dotenv from 'dotenv'
// DATABASES CONNECTIONS
import './db/redis.client.js'
import './db/mongodb.js'

// START APPLICATION

import app from './app.js'
dotenv.config()

const PORT = process.env.PORT || 5050

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
})
