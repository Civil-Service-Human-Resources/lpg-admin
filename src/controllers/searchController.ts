import {Request, Response, Router} from 'express'
import {LearningCatalogue} from '../learning-catalogue'
import {Course} from '../learning-catalogue/model/course'
import {DefaultPageResults} from '../learning-catalogue/model/defaultPageResults'

import * as striptags from 'striptags'
import {Pagination} from 'lib/pagination'

export class SearchController {
	router: Router
	learningCatalogue: LearningCatalogue
	pagination: Pagination

	constructor(learningCatalogue: LearningCatalogue, pagination: Pagination) {
		this.learningCatalogue = learningCatalogue
		this.pagination = pagination
		this.router = Router()
		this.configureRouterPaths()
	}

	private configureRouterPaths() {
		this.router.get('/content-management/search', this.searchCourses())
	}

	searchCourses() {
		const self = this

		return async (request: Request, response: Response) => {
			let {page, size} = this.pagination.getPageAndSizeFromRequest(request)
			let query = ''
			if (request.query.q) {
				// @ts-ignore
				query = striptags(request.query.q)
			}
			// prettier-ignore
			const pageResults: DefaultPageResults<Course> = await self.learningCatalogue.searchCourses(query, page, size)

			response.render('page/search-results', {
				pageResults: pageResults,
				query: query,
			})
		}
	}
}
