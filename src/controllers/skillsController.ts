import {Request, Response, Router} from 'express'
// import parse from 'csv-parse'

import * as log4js from 'log4js'
import {CsrsService} from "../csrs/service/csrsService";

export class SkillsController {
	csrsService: CsrsService
	logger = log4js.getLogger('controllers/searchController')
	router: Router

	constructor(
		csrsService: CsrsService
	) {
		this.router = Router()
		this.configureRouterPaths()
		this.csrsService = csrsService
	}

	private configureRouterPaths() {
		this.router.get('/content-management/skills', this.getSkills())
		// this.router.post('/skills/', this.uploadAndProcess())
	}

	getSkills() {
		return async (req: Request, res: Response) => {
			const areasOfWork = await this.csrsService.getAreasOfWork()

			res.render('page/skills/skills', {areasOfWork: areasOfWork})
		}
	}

	// uploadAndProcess() {
	// 	//TODO: take the profession ID from the request
	// 	//TODO: Take the uploaded file
	// 	const output = []
	// 	let parser = parse("uploaded file");
	// 	parser.on('readable', () => {
	// 		let record
	// 		while (record = parser.read()) {
	// 			output.push(record)
	// 			//TODO: verify the record matches what we expect maybe?
	// 		}
	// 	})
	// 	parser.on('error', (err: any) => {
	// 		console.error(err.message)
	// 		//TODO: display error on UI
	// 	})
	//
	// 	parser.on('end', () => {
	// 		// TODO: now send the array to the API
    //         // TODO: send success to the UI
	// 	})
	// }
}
