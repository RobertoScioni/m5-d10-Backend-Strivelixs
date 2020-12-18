/**
 * external module
 */
const express = require("express")
const cors = require("cors")
const { join } = require("path")
/**
 * internal modules
 */
const { initialize } = require("./services/dbms")
const { badRequest, funny, catchAllHandler } = require("./services/error")
const mediaRoutes = require("./services/media")
const reviewRoutes = require("./services/reviews")

/**
 * initializations
 */
const server = express()
const port = process.env.PORT || 2001
const publicFolder = process.env.PUBLIC || join(__dirname, "../public")
initialize()

//server initialization process
server.use(cors())
server.use(express.json())
server.use(express.static(publicFolder)) //overkill, i know
server.use("/media", mediaRoutes)
server.use("/reviews", reviewRoutes)
server.use(badRequest)
server.use(funny)
server.use(catchAllHandler)

/**
 * start
 */
server.listen(port, () => {
	//console.clear()
	console.log("server running on port: ", port)
	console.log("serving files from ", publicFolder)
})
