import {NextFunction, Request, Response, Router} from 'express'
import {ModuleFactory} from '../../learning-catalogue/model/factory/moduleFactory'
import {LearningCatalogue} from '../../learning-catalogue'
import { getLogger } from '../../utils/logger'

export class ModuleController {
	logger = getLogger('ModuleController')
	learningCatalogue: LearningCatalogue
	moduleFactory: ModuleFactory
	router: Router

	constructor(learningCatalogue: LearningCatalogue, moduleFactory: ModuleFactory) {
		this.learningCatalogue = learningCatalogue
		this.moduleFactory = moduleFactory
		this.router = Router()
		this.setRouterPaths()
	}

	/* istanbul ignore next */
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
		this.router.get('/content-management/courses/:courseId/:moduleId/delete', this.deleteModule())
	}

	public addModule() {
		this.logger.debug('Add module page')

		return async (request: Request, response: Response) => {
			response.render('page/course/module/add-module')
		}
	}

	public setModule() {
		return async (request: Request, response: Response) => {
			const moduleType = request.body.module
			const courseId = response.locals.course.id

			if (moduleType === '') {
				return response.redirect(`/content-management/courses/${courseId}/add-module`)
			}

			return response.redirect(`/content-management/courses/${courseId}/module-${moduleType}`)
		}
	}

	public addFile() {
		return async (request: Request, response: Response) => {
			response.render('page/course/module/module-file')
		}
	}

	public deleteModule() {
		return async (request: Request, response: Response, next: NextFunction) => {
			const courseId = response.locals.course.id
			const moduleId = request.params.moduleId

			await this.learningCatalogue
				.deleteModule(courseId, moduleId)
				.then(() => {
					return response.redirect(`/content-management/courses/${courseId}/add-module`)
				})
				.catch(error => {
					next(error)
				})
		}
	}
}
