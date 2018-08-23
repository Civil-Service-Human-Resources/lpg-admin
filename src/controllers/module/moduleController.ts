import {Request, Response, Router} from 'express'
import {ModuleFactory} from '../../learning-catalogue/model/factory/moduleFactory'
import * as log4js from 'log4js'
import {LearningCatalogue} from '../../learning-catalogue'

const logger = log4js.getLogger('controllers/moduleController')

export class ModuleController {
	learningCatalogue: LearningCatalogue
	moduleFactory: ModuleFactory
	router: Router

	constructor(learningCatalogue: LearningCatalogue, moduleFactory: ModuleFactory) {
		this.learningCatalogue = learningCatalogue
		this.moduleFactory = moduleFactory
		this.router = Router()
		this.setRouterPaths()
	}

	private setRouterPaths() {
		this.router.param('courseId', async (req, res, next, courseId) => {
			const course = await this.learningCatalogue.getCourse(courseId)
			if (course) {
				res.locals.course = course
				next()
			} else {
				res.sendStatus(404)
			}
		})
		this.router.get('/content-management/courses/:courseId/add-module', this.addModule())
		this.router.post('/content-management/courses/:courseId/add-module', this.setModule())
	}

	public addModule() {
		logger.debug('Add module page')

		return async (request: Request, response: Response) => {
			response.render('page/course/module/add-module')
		}
	}

	public setModule() {
		return async (request: Request, response: Response) => {
			const moduleType = request.body.module
			const courseId = response.locals.course.id
			if (moduleType !== '') {
				response.redirect(`/content-management/courses/${courseId}/module/add-${moduleType}`)
			} else {
				response.redirect(`/content-management/courses/${courseId}/add-module`)
			}
		}
	}

	public addFile() {
		return async (request: Request, response: Response) => {
			response.render('page/course/module/add-file')
		}
	}
}
