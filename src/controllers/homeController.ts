import {NextFunction, Request, Response} from 'express'
import {LearningCatalogue} from '../learning-catalogue'

import {Pagination} from 'lib/pagination'

export class HomeController {
	learningCatalogue: LearningCatalogue
	pagination: Pagination

	constructor(learningCatalogue: LearningCatalogue, pagination: Pagination) {
		this.learningCatalogue = learningCatalogue
		this.pagination = pagination
	}

	public index() {
		return async (request: Request, response: Response, next: NextFunction) => {
			let {page, size} = this.pagination.getPageAndSizeFromRequest(request)

			await this.learningCatalogue
				.listCourses(page, size)
				.then(pageResults => {
					response.render('page/index', {
						pageResults,
					})
				})
				.catch(error => {
					if (error.response && error.response.status == 403) {
						response.render('page/index')
					} else {
						next(error)
					}
				})
		}
	}
}
