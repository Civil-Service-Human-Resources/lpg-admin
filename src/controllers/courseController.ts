import _ = require('lodash')

import {NextFunction, Request, Response, Router} from 'express'
import {CourseFactory} from '../learning-catalogue/model/factory/courseFactory'
import {LearningCatalogue} from '../learning-catalogue'
import {Course} from '../learning-catalogue/model/course'
import {Validator} from '../learning-catalogue/validator/validator'
import {Module} from '../learning-catalogue/model/module'
import {CourseService} from '../lib/courseService'
import {CsrsService} from '../csrs/service/csrsService'
import {Audience} from '../learning-catalogue/model/audience'
import {DateTime} from '../lib/dateTime'
import {Validate} from './formValidator'
import {FormController} from './formController'
import * as asyncHandler from 'express-async-handler'
import { getLogger } from '../utils/logger'

export class CourseController implements FormController {
	logger = getLogger('CourseController')
	learningCatalogue: LearningCatalogue
	validator: Validator<Course>
	courseFactory: CourseFactory
	router: Router
	courseService: CourseService
	csrsService: CsrsService

	constructor(learningCatalogue: LearningCatalogue, courseValidator: Validator<Course>, courseFactory: CourseFactory, courseService: CourseService, csrsService: CsrsService) {
		this.learningCatalogue = learningCatalogue
		this.validator = courseValidator
		this.courseFactory = courseFactory
		this.courseService = courseService
		this.csrsService = csrsService
		this.router = Router()

		this.getCourseFromRouterParamAndSetOnLocals()

		this.configureRouterPaths()
	}

	// prettier-ignore
	/* istanbul ignore next */
	private getCourseFromRouterParamAndSetOnLocals() {
		this.router.param('courseId', asyncHandler(async (req: Request, res: Response, next: NextFunction, courseId: string) => {
				const course = await this.learningCatalogue.getCourse(courseId)

				if (course) {
					res.locals.course = course
					next()
				} else {
					res.sendStatus(404)
				}
			})
		)
	}

	/* istanbul ignore next */
	private configureRouterPaths() {
		this.router.get('/content-management/courses/:courseId/overview', asyncHandler(this.checkForEventViewRole()), asyncHandler(this.courseOverview()))
		this.router.get('/content-management/courses/:courseId/preview', this.checkForEventViewRole(), this.coursePreview())

		this.router.get('/content-management/courses/visibility/:courseId?', this.getCourseVisibility())
		this.router.post('/content-management/courses/visibility/:courseId?', this.setCourseVisibility())
		this.router.get('/content-management/courses/title/:courseId?', this.getCourseTitle())
		this.router.post('/content-management/courses/title/', this.createCourseTitle())
		this.router.post('/content-management/courses/title/:courseId', this.updateCourseTitle())

		this.router.get('/content-management/courses/details/:courseId?', this.getCourseDetails())
		this.router.post('/content-management/courses/details/', this.createCourseDetails())
		this.router.post('/content-management/courses/details/:courseId', this.updateCourseDetails())

		this.router.get('/content-management/courses/:courseId/sort-modules', this.sortModules())
		this.router.get('/content-management/courses/:courseId/archive', this.getArchiveConfirmation())
		this.router.post('/content-management/courses/:courseId/status/publish', this.publishCourse())
		this.router.post('/content-management/courses/:courseId/status/archive', this.archiveCourse())
		this.router.get('/content-management/courses/:courseId/sortDateRanges-modules', this.sortModules())
	}

	public checkForEventViewRole() {
		return (req: Request, res: Response, next: NextFunction) => {
			if (req.user && req.user.hasEventViewingRole()) {
				next()
			} else {
				if (req.user && req.user.uid) {
					this.logger.error('Rejecting user without event viewing role ' + req.user.uid + ' with IP ' 
						+ req.ip + ' from page ' + req.originalUrl)
					}
				res.render('page/unauthorised')
			}
		}
	}

	courseOverview() {
		return async (req: Request, res: Response) => {
			const faceToFaceModules = res.locals.course.modules.filter((module: Module) => module.type == Module.Type.FACE_TO_FACE)
			const departmentCodeToName = await this.csrsService.getDepartmentCodeToNameMapping()
			const gradeCodeToName = await this.csrsService.getGradeCodeToNameMapping()
			const audienceIdToEvent = this.courseService.getAudienceIdToEventMapping(res.locals.course)
			const eventIdToModuleId = this.courseService.getEventIdToModuleIdMapping(res.locals.course)

			const grades = this.courseService.getUniqueGrades(res.locals.course)

			const sortedAudiences = await this.courseService.sortAudiences(res.locals.course.audiences)

			res.render('page/course/course-overview', {
				faceToFaceModules,
				AudienceType: Audience.Type,
				departmentCodeToName,
				gradeCodeToName,
				audienceIdToEvent,
				eventIdToModuleId,
				grades,
				sortedAudiences,
			})
		}
	}

	coursePreview() {
		return async (request: Request, response: Response) => {
			const modules: Module[] = response.locals.course.modules

			for (let module of modules) {
				if (module.type === Module.Type.FACE_TO_FACE) {
					const events = _.get(module, 'events', [])
					// @ts-ignore
					events.sort(function compare(a, b) {
						const dateA = new Date(_.get(a, 'startDate', ''))
						const dateB = new Date(_.get(b, 'startDate', ''))
						// @ts-ignore
						return dateA - dateB
					})
					if (events && events.length > 0) {
						module.duration = events[0].getDuration()
					}
				}
				module.formattedDuration = DateTime.formatDuration(module.duration)
			}
			response.render('page/course/course-preview')
		}
	}

	getCourseVisibility() {
		return async (request: Request, response: Response) => {
			response.render('page/course/course-visibility')
		}
	}

	@Validate({
		fields: ['visibility'],
		redirect: '/content-management/courses/visibility',
	})
	setCourseVisibility() {
		return async (request: Request, response: Response) => {
			const course = this.courseFactory.create(request.body)
			request.session!.sessionFlash = {course}

			request.session!.save(() => {
				response.redirect('/content-management/courses/title/')
			})
		}
	}

	getCourseTitle() {
		return async (request: Request, response: Response) => {
			response.render('page/course/course-title')
		}
	}

	@Validate({
		fields: ['title'],
		redirect: '/content-management/courses/title/:courseId',
	})
	updateCourseTitle() {
		return async (request: Request, response: Response, next: NextFunction) => {
			let course = response.locals.course
			course.title = request.body.title
			course.topicId = request.body.topicId

			await this.learningCatalogue
				.updateCourse(course)
				.then(() => {
					response.redirect(`/content-management/courses/${request.params.courseId}/preview`)
				})
				.catch(error => {
					next(error)
				})
		}
	}

	@Validate({
		fields: ['title'],
		redirect: '/content-management/courses/title/',
	})
	createCourseTitle() {
		return async (request: Request, response: Response) => {
			const course = this.courseFactory.create(request.body)
			request.session!.sessionFlash = {course}
			request.session!.save(() => {
				response.redirect('/content-management/courses/details')
			})
		}
	}

	getCourseDetails() {
		return async (request: Request, response: Response) => {
			response.render('page/course/course-details')
		}
	}

	@Validate({
		fields: ['shortDescription', 'description'],
		redirect: '/content-management/courses/details',
	})
	createCourseDetails() {
		return async (req: Request, res: Response, next: NextFunction) => {
			const course = this.courseFactory.create(req.body)

			await this.learningCatalogue
				.createCourse(course)
				.then(savedCourse => {
					req.session!.sessionFlash = {courseAddedSuccessMessage: 'course_added_success_message'}
					req.session!.save(() => {
						res.redirect(`/content-management/courses/${savedCourse.id}/overview`)
					})
				})
				.catch(error => {
					next(error)
				})
		}
	}

	@Validate({
		fields: ['shortDescription', 'description'],
		redirect: '/content-management/courses/details/:courseId',
	})
	updateCourseDetails() {
		return async (req: Request, res: Response, next: NextFunction) => {
			let course = res.locals.course
			course.shortDescription = req.body.shortDescription
			course.description = req.body.description
			course.learningOutcomes = req.body.learningOutcomes
			course.preparation = req.body.preparation

			await this.learningCatalogue
				.updateCourse(course)
				.then(() => {
					res.redirect(`/content-management/courses/${req.params.courseId}/preview`)
				})
				.catch(error => {
					next(error)
				})
		}
	}

	sortModules() {
		return async (request: Request, response: Response, next: NextFunction) => {
			return await this.courseService
				// @ts-ignore
				.sortModules(request.params.courseId, request.query.moduleIds)
				.then(() => {
					response.redirect(`/content-management/courses/${request.params.courseId}/add-module`)
				})
				// @ts-ignore
				.catch(error => {
					next(error)
				})
		}
	}

	@Validate({
		fields: ['status'],
		redirect: '/content-management/courses/:courseId/overview',
	})
	publishCourse() {
		return async (request: Request, response: Response, next: NextFunction) => {
			let course = response.locals.course
			course.status = request.body.status

			await this.learningCatalogue
				.publishCourse(course)
				.then(() => {
					request.session!.save(() => {
						response.redirect(`/content-management/courses/${request.params.courseId}/overview`)
					})
				})
				.catch(error => {
					next(error)
				})
		}
	}

	@Validate({
		fields: ['status'],
		redirect: '/content-management/courses/:courseId/overview',
	})
	archiveCourse() {
		return async (request: Request, response: Response, next: NextFunction) => {
			let course = response.locals.course
			course.status = request.body.status

			await this.learningCatalogue
				.archiveCourse(course)
				.then(() => {
					request.session!.save(() => {
						response.redirect(`/content-management/courses/${request.params.courseId}/overview`)
					})
				})
				.catch(error => {
					next(error)
				})
		}
	}

	getArchiveConfirmation() {
		return async (request: Request, response: Response) => {
			response.render('page/course/archive')
		}
	}
}
