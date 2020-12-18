/**
 *  Every product in your marketplace is shaped in this way:
 *    {
 *       "_id": "5d318e1a8541744830bef139", //SERVER GENERATED
 *       "name": "app test 1",  //REQUIRED
 *       "description": "somthing longer", //REQUIRED
 *       "brand": "nokia", //REQUIRED
 *       "imageUrl": "https://drop.ndtv.com/TECH/product_database/images/2152017124957PM_635_nokia_3310.jpeg?downsize=*:420&output-quality=80",
 *       "price": 100, //REQUIRED
 *       "category": "smartphones"
 *       "createdAt": "2019-07-19T09:32:10.535Z", //SERVER GENERATED
 *       "updatedAt": "2019-07-19T09:32:10.535Z", //SERVER GENERATED
 *   }
 *
 *  CRUD for Products ( /products GET, POST, DELETE, PUT)
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
	toArray,
	del,
	linkArrayFile,
	checkExistanceInArray,
	insertInArray,
	delFromArray,
	updateElement,
} = require("../dbms")
const { join } = require("path")
const fs = require("fs-extra") //friendship ended with fs, fs extra is my new best friend
const multer = require("multer")
const { writeFile } = require("fs-extra")
const { check, validationResult } = require("express-validator")
//initialization
const router = express.Router()
const upload = multer({})
const Table = "movies.json"
const validMedia = [
	check("Title")
		.isLength({ min: 2 })
		.withMessage("minimum lenght is 3 characters")
		.exists()
		.withMessage("Title must exist"),
	check("Year")
		.isNumeric()
		.withMessage("year should be a number")
		.exists()
		.withMessage("a year is required"),
	check("imdbID").exists().withMessage("an ImdbID is required"),
	check("Type")
		.isLength({ min: 4 })
		.withMessage("type too short")
		.exists()
		.withMessage("description must be provided"),
]
const validMediaUpd = [
	check("Title")
		.isLength({ min: 2 })
		.withMessage("minimum lenght is 3 characters")
		.exists()
		.withMessage("Title must exist"),
	check("Year")
		.isNumeric()
		.withMessage("year should be a number")
		.exists()
		.withMessage("a year is required"),
	check("Type")
		.isLength({ min: 4 })
		.withMessage("type too short")
		.exists()
		.withMessage("description must be provided"),
]
//routes
router.get("/", async (req, res, next) => {
	let body = null

	try {
		body = await openTable(Table)
		console.log(body)
	} catch (error) {
		console.error(error)
		error.httpStatusCode = 500
		next(error)
	}
	body = toArray(body, "_id")
	if (req.query.hasOwnProperty("category")) {
		body = body.filter((product) => product.category === req.query.category) //selectByField(Table, "category", req.query.category, 1)
	}

	res.send(body)
})

router.post("/", validMedia, async (req, res, next) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		const err = {}
		err.message = errors
		console.log(err.message)
		err.httpStatusCode = 400
		next(err)
		return
	}
	let unique = true
	let body = { ...req.body }
	try {
		unique = await checkExistanceInArray(Table, "imdbID", req.body.imdbID)
		console.log("is " + req.body.imdbID + " unique? ", unique)
	} catch (error) {
		error.httpStatusCode = "403"
		console.error("could not chek for uniqueness")
		next(error)
	}
	try {
		if (!unique) {
			throw new Error("not unique")
		}
	} catch (error) {
		error.httpStatusCode = "403"
		console.error("pre-existent id")
		next(error)
		return -1
	}
	try {
		//let body = { ...req.body }
		body.createdAt = new Date()
		await insertInArray(Table, body)
		res.send(req.body.imdbID)
	} catch (error) {
		console.error(error)
		error.httpStatusCode = 500
		next(error)
	}
})

router.delete("/:id", async (req, res, next) => {
	try {
		delFromArray(Table, req.params.id, "imdbID")
		res.send("deleted")
	} catch (error) {
		console.error(error)
		error.httpStatusCode = 500
		next(error)
	}
})

router.put("/:id", validMediaUpd, async (req, res, next) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		const err = {}
		err.message = errors
		//console.log(err.message)
		err.httpStatusCode = 400
		next(err)
		return
	}
	try {
		let body = { ...req.body }
		body.updatedAt = new Date()
		updateElement(Table, body, req.params.id, "imdbID")
		res.send("ok")
	} catch (error) {
		console.error(error)
		error.httpStatusCode = 500
		next(error)
	}
})

router.post("/:id/image", upload.single("Poster"), async (req, res, next) => {
	try {
		const dest = join(
			__dirname,
			"../../../public/img/movies",
			req.file.originalname
		)

		console.log("save image in ", dest)
		console.log("buffer mime", req.file.mimetype)
		console.log(req.file.buffer)
		await writeFile(dest, req.file.buffer)
		linkArrayFile(
			Table,
			req.params.id,
			"imdbID",
			`http://localhost:${process.env.PORT || 2001}/img/movies/${
				req.file.originalname
			}`,
			"Poster"
		)
		res.send("ok")
	} catch (error) {
		console.error(error)
		error.httpStatusCode = 500
		next(error)
	}
})

module.exports = router
