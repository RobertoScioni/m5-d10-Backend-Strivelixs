/**
 *   the reviews look like this:
 *    {
 *       "_id": "123455", //SERVER GENERATED
 *       "comment": "A good book but definitely I don't like many parts of the plot", //REQUIRED
 *       "rate": 3, //REQUIRED, max 5
 *       "elementId": "5d318e1a8541744830bef139", //REQUIRED
 *       "createdAt": "2019-08-01T12:46:45.895Z" // SERVER GENERATED
 *   },
 *
 *  CRUD for Reviews ( /reviews GET, POST, DELETE, PUT)
 */

/**
 * basic imports
 */
const { response } = require("express")
const express = require("express")
const {
	openTable,
	insert,
	checkId,
	selectByField,
	del,
	linkFile,
	toArray,
	checkExistanceInArray,
} = require("../dbms")
const { join } = require("path")
const fs = require("fs-extra") //friendship ended with fs, fs extra is my new best friend
const multer = require("multer")
const { writeFile } = require("fs-extra")
const { check, validationResult } = require("express-validator")
//initialization
const router = express.Router()
const upload = multer({})
const table = "reviews.json"
const subjects = "movies.json"
const valid = [
	check("comment")
		.isLength({ min: 3 })
		.withMessage("minimum lenght is 3 characters")
		.exists()
		.withMessage("name must exist"),
	check("elementId")
		.isLength({ min: 14 })
		.withMessage("product id too short")
		.exists()
		.withMessage("product id must be provided"),
	check("rate")
		.isNumeric({ max: 5, min: 0 })
		.withMessage("rate must be a numeber from 0 to 5v")
		.exists()
		.withMessage("rate must exist"),
]
//routes
router.get("/", async (req, res, next) => {
	let body = null
	try {
		body = await openTable(table)
		console.log(body)
	} catch (error) {
		console.error(error)
		error.httpStatusCode = 500
		next(error)
	}
	res.send(body)
})

router.get("/:id", async (req, res, next) => {
	let body = null
	try {
		body = await openTable(table)
		console.log(body)
	} catch (error) {
		console.error(error)
		error.httpStatusCode = 500
		next(error)
	}
	body = toArray(body, "_id")
	body = body.filter((review) => review.elementId === req.params.id)
	res.send(body)
})

router.post("/", valid, async (req, res, next) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		const err = {}
		err.message = errors
		console.log(err.message)
		err.httpStatusCode = 400
		next(err)
		return
	}
	//check id against the subjects table-- note subject is an Array structure
	try {
		if (!checkExistanceInArray(subjects, "imdbID", req.body.elementId)) {
			throw new Error("what exactly are you trying to review?")
		}
	} catch (error) {
		console.error(error.message)
		next(error)
		return -1
	}

	console.log("non dovrei esistere")
	try {
		let body = { ...req.body }
		body.createdAt = new Date()

		const id = await insert(table, body, null)
		res.send(id)
	} catch (error) {
		console.error(error)
		error.httpStatusCode = 500
		next(error)
	}
})

router.delete("/:id", async (req, res, next) => {
	try {
		del(table, req.params.id)
		res.send("deleted")
	} catch (error) {
		console.error(error)
		error.httpStatusCode = 500
		next(error)
	}
})

router.put("/:id", valid, async (req, res, next) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		const err = {}
		err.message = errors
		console.log(err.message)
		err.httpStatusCode = 400
		next(err)
		return
	}
	try {
		let body = { ...req.body }
		body.updatedAt = new Date()
		let id = await insert(table, body, req.params.id)

		if (typeof id === "object") {
			throw id
		}
		console.log("this should be a string or an object i think ", typeof id)
		res.send("ok")
	} catch (error) {
		console.error(error)
		error.httpStatusCode = error.hasOwnProperty("httpStatusCode") || 500
		next(error)
	}
})

router.post("/:id/image", upload.single("picture"), async (req, res, next) => {
	try {
		const dest = join(
			__dirname,
			"../../../public/img/products",
			req.file.originalname
		)

		console.log("save image in ", dest)
		console.log("buffer mime", req.file.mimetype)
		console.log(req.file.buffer)
		await writeFile(dest, req.file.buffer)
		linkFile(
			table,
			req.params.id,
			"image",
			`http://localhost:${process.env.PORT || 2001}/img/products/${
				req.file.originalname
			}`
		)
		res.send("ok")
	} catch (error) {
		console.error(error)
		error.httpStatusCode = 500
		next(error)
	}
})

module.exports = router
