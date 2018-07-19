import {Request, Response} from 'express'
import {LearningCatalogue} from '../learning-catalogue'
import {Course} from '../learning-catalogue/model/course'
import {PageResults} from '../learning-catalogue/model/pageResults'

export class HomeController {
	learningCatalogue: LearningCatalogue

	constructor(learningCatalogue: LearningCatalogue) {
		this.learningCatalogue = learningCatalogue
	}

	public index() {
		const self = this

		return async (request: Request, response: Response) => {
			const pageResults: PageResults<
				Course
			> = await self.learningCatalogue.listAll()

			response.render('index', {
				results: pageResults,
			})
		}
	}
}
