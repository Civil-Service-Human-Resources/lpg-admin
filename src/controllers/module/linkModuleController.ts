import {NextFunction, Request, Response, Router} from 'express'
import {LearningCatalogue} from '../../learning-catalogue'
import {LinkFactory} from '../../learning-catalogue/model/factory/linkFactory'
import {Validator} from '../../learning-catalogue/validator/validator'
import {Module} from '../../learning-catalogue/model/module'
import moment = require('moment')
import {CourseService} from 'lib/courseService'
import {LinkModule} from '../../learning-catalogue/model/linkModule'
import * as asyncHandler from 'express-async-handler'
import { getLogger } from '../../utils/logger'

export class LinkModuleController {
	logger = getLogger('LinkModuleController')
	learningCatalogue: LearningCatalogue
	linkFactory: LinkFactory
	moduleValidator: Validator<Module>
	courseService: CourseService

	router: Router

	constructor(learningCatalogue: LearningCatalogue, linkFactory: LinkFactory, moduleValidator: Validator<Module>, courseService: CourseService) {
		this.learningCatalogue = learningCatalogue
		this.linkFactory = linkFactory
		this.moduleValidator = moduleValidator
		this.courseService = courseService

		this.router = Router()

		this.setRouterPaths()
	}

	/* istanbul ignore next */
	private setRouterPaths() {
		let course: any

		this.router.param('courseId', async (req, res, next, courseId) => {
			course = await this.learningCatalogue.getCourse(courseId)
			if (course) {
				res.locals.course = course
				next()
			} else {
				res.sendStatus(404)
			}
		})
		this.router.param('moduleId', async (req, res, next, moduleId) => {
			if (course) {
				const module = this.courseService.getModuleByModuleId(course, moduleId)
				if (module) {
					const duration = moment.duration(module.duration, 'seconds')
					res.locals.module = module
					res.locals.module.hours = duration.hours()
					res.locals.module.minutes = duration.minutes()
					next()
				} else {
					res.sendStatus(404)
				}
			} else {
				res.sendStatus(404)
			}
		})
		this.router.get('/content-management/courses/:courseId/module-link/:moduleId?', asyncHandler(this.addLinkModule()))
		this.router.get('/content-management/courses/:courseId/module-link', asyncHandler(this.addLinkModule()))
		this.router.post('/content-management/courses/:courseId/module-link', asyncHandler(this.setLinkModule()))
		this.router.post('/content-management/courses/:courseId/module-link/:moduleId?', asyncHandler(this.updateLinkModule()))
	}

	public addLinkModule() {
		this.logger.debug('Add module page')

		return async (request: Request, response: Response) => {
			response.render('page/course/module/module-link')
		}
	}

	public setLinkModule() {
		return async (request: Request, response: Response, next: NextFunction) => {
			const course = response.locals.course
			const data = {
				...request.body,
				duration: moment
					.duration({
						hours: request.body.hours,
						minutes: request.body.minutes,
					})
					.asSeconds(),
				type: 'link',
			}

			const errors = await this.moduleValidator.check(data, ['title', 'description', 'url', 'duration'])

			if (errors.size) {
				return response.render('page/course/module/module-link', {
					module: data,
					errors: errors,
				})
			}

			const linkModule = this.linkFactory.create(data)

			await this.learningCatalogue
				.createModule(course.id, linkModule)
				.then(() => {
					return response.redirect(`/content-management/courses/${course.id}/add-module`)
				})
				.catch(error => {
					next(error)
				})
		}
	}

	public updateLinkModule() {
		return async (req: Request, res: Response, next: NextFunction) => {
			const course = res.locals.course

			let module: LinkModule = res.locals.module
			module.title = req.body.title
			module.description = req.body.description
			module.url = req.body.url
			module.optional = req.body.optional
			module.associatedLearning = req.body.associatedLearning
			module.duration = moment
				.duration({
					hours: req.body.hours,
					minutes: req.body.minutes,
				})
				.asSeconds()

			const errors = await this.moduleValidator.check(module, ['title', 'description', 'url', 'duration'])

			if (errors.size) {
				return res.render('page/course/module/module-link', {
					module: module,
					errors: errors,
				})
			}

			await this.learningCatalogue
				.updateModule(course.id, module)
				.then(() => {
					res.redirect(`/content-management/courses/${course.id}/add-module`)
				})
				.catch(error => {
					next(error)
				})
		}
	}
}
