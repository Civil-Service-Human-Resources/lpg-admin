import {NextFunction, Request, Response, Router} from 'express'
import {AudienceFactory} from '../../learning-catalogue/model/factory/audienceFactory'
import {LearningCatalogue} from '../../learning-catalogue'
import {Event} from '../../learning-catalogue/model/event'
import {Audience} from '../../learning-catalogue/model/audience'
import {Validator} from '../../learning-catalogue/validator/validator'
import {CourseService} from '../../lib/courseService'
import {AudienceService} from '../../lib/audienceService'
import {CsrsService} from '../../csrs/service/csrsService'
import {DateTime} from '../../lib/dateTime'
import {Csrs} from '../../csrs'
import * as moment from 'moment'
import {OrganisationalUnit} from '../../csrs/model/organisationalUnit'
import {DefaultPageResults} from '../../learning-catalogue/model/defaultPageResults'

export class AudienceController {
	learningCatalogue: LearningCatalogue
	audienceValidator: Validator<Audience>
	audienceFactory: AudienceFactory
	courseService: CourseService
	csrsService: CsrsService
	csrs: Csrs
	audienceService: AudienceService
	router: Router

	constructor(
		learningCatalogue: LearningCatalogue,
		audienceValidator: Validator<Audience>,
		audienceFactory: AudienceFactory,
		courseService: CourseService,
		csrsService: CsrsService,
		csrs: Csrs,
		audienceService: AudienceService
	) {
		this.learningCatalogue = learningCatalogue
		this.audienceValidator = audienceValidator
		this.audienceFactory = audienceFactory
		this.courseService = courseService
		this.csrsService = csrsService
		this.csrs = csrs
		this.router = Router()
		this.audienceService = audienceService
		this.configurePathParametersProcessing()
		this.setRouterPaths()
	}

	private configurePathParametersProcessing() {
		this.router.param('courseId', this.courseService.findCourseByCourseIdAndAssignToResponseLocalsOrReturn404())
		this.router.param('audienceId', AudienceService.findAudienceByAudienceIdAndAssignToResponseLocalsOrReturn404())
	}

	private setRouterPaths() {
		this.router.post('/content-management/courses/:courseId/audiences/', this.setAudienceName())

		this.router.get('/content-management/courses/:courseId/audiences/:audienceId/configure', this.getConfigureAudience())

		this.router.get('/content-management/courses/:courseId/audiences/:audienceId/organisation', this.getOrganisation())
		this.router.post('/content-management/courses/:courseId/audiences/:audienceId/organisation', this.setOrganisation())
		this.router.get('/content-management/courses/:courseId/audiences/:audienceId/organisation/delete/:organisationCode', this.deleteOrganisation())

		this.router.get('/content-management/courses/:courseId/audiences/:audienceId/delete', this.deleteAudienceConfirmation())
		this.router.post('/content-management/courses/:courseId/audiences/:audienceId/delete', this.deleteAudience())

		this.router.get('/content-management/courses/:courseId/audiences/:audienceId/area-of-work', this.getAreasOfWork())
		this.router.post('/content-management/courses/:courseId/audiences/:audienceId/area-of-work', this.setAreasOfWork())
		this.router.post('/content-management/courses/:courseId/audiences/:audienceId/area-of-work/delete', this.deleteAreasOfWork())

		this.router.get('/content-management/courses/:courseId/audiences/:audienceId/add-core-learning', this.getCoreLearning())
		this.router.post('/content-management/courses/:courseId/audiences/:audienceId/add-core-learning', this.setCoreLearning())
		this.router.post('/content-management/courses/:courseId/audiences/:audienceId/core-learning/delete', this.deleteCoreLearning())

		this.router.get('/content-management/courses/:courseId/audiences/:audienceId/grades', this.getGrades())
		this.router.post('/content-management/courses/:courseId/audiences/:audienceId/grades', this.setGrades())
		this.router.post('/content-management/courses/:courseId/audiences/:audienceId/grades/delete', this.deleteGrades())

		this.router.get('/content-management/courses/:courseId/audiences/:audienceId/event', this.getPrivateCourseEvent())
		this.router.post('/content-management/courses/:courseId/audiences/:audienceId/event', this.setPrivateCourseEvent())
		this.router.post('/content-management/courses/:courseId/audiences/:audienceId/event/delete', this.deletePrivateCourseEvent())

		this.router.get('/content-management/courses/:courseId/audiences/:audienceId/required-learning', this.getRequiredLearning())
		this.router.post('/content-management/courses/:courseId/audiences/:audienceId/required-learning', this.setRequiredLearning())
		this.router.post('/content-management/courses/:courseId/audiences/:audienceId/required-learning/delete', this.deleteRequiredLearning())
	}

	setAudienceName() {
		return async (req: Request, res: Response) => {
			const audience: Audience = new Audience()

			audience.name = await this.audienceService.getAudienceName(audience)
			audience.type = Audience.Type.OPEN

			const savedAudience = await this.learningCatalogue.createAudience(req.params.courseId, audience)

			req.session!.save(() => {
				res.redirect(`/content-management/courses/${req.params.courseId}/audiences/${savedAudience.id}/configure`)
			})
		}
	}

	getConfigureAudience() {

			return async (req: Request, res: Response) => {
			const departmentCodeToName = await this.csrsService.getDepartmentCodeToNameMapping()
			const gradeCodeToName = await this.csrsService.getGradeCodeToNameMapping()
			const audienceIdToEvent = this.courseService.getAudienceIdToEventMapping(res.locals.course)
			const requiredBy = res.locals.audience.requiredBy ? new Date(res.locals.audience.requiredBy) : null
			const audiencesForDepartment = res.locals.audience.departments

			for (let i = 0; i < audiencesForDepartment.length; i++) {
				if(audiencesForDepartment[i].includes("-"))
				{
					audiencesForDepartment[i] = audiencesForDepartment[i].replace("-", 'dash');
				}
			}

			res.render('page/course/audience/configure-audience', {
				requiredBy,
				AudienceType: Audience.Type,
				departmentCodeToName,
				gradeCodeToName,
				audienceIdToEvent,
				audiencesForDepartment
			})
	 	}
	}

	getOrganisation() {
		return async (req: Request, res: Response) => {
			const selectedOrganisations = res.locals.audience.departments

			let organisations: DefaultPageResults<OrganisationalUnit> = await this.csrs.listOrganisationalUnitsForTypehead()

			res.render('page/course/audience/add-organisation', {organisationalUnits: organisations, selectedOrganisations: selectedOrganisations})
		}
	}

	setOrganisation() {
		return async (req: Request, res: Response, next: NextFunction) => {
			const selectedOrganisationalUnit: string = req.body['parent']

			const existingDepartments: string[] = res.locals.audience.departments

			if (existingDepartments.includes(selectedOrganisationalUnit) || selectedOrganisationalUnit === '' || selectedOrganisationalUnit === null) {
				req.session!.sessionFlash = {errors: true}
				req.session!.save(() => {
					return res.redirect(`/content-management/courses/${req.params.courseId}/audiences/${req.params.audienceId}/organisation`)
				})
			} else {
				existingDepartments.push(selectedOrganisationalUnit)

				res.locals.audience.departments = existingDepartments

				res.locals.audience.name = await this.audienceService.getAudienceName(res.locals.audience)

				await this.learningCatalogue
					.updateAudience(res.locals.course.id, res.locals.audience)
					.then(() => {
						res.redirect(`/content-management/courses/${req.params.courseId}/audiences/${req.params.audienceId}/organisation`)
					})
					.catch(error => {
						next(error)
					})
			}
		}
	}
	deleteOrganisation() {
		return async (req: Request, res: Response, next: NextFunction) => {
			const organisationalUnitCode = req.params.organisationCode
			const selectedOrganisations: OrganisationalUnit[] = res.locals.audience.departments

			selectedOrganisations.forEach((item, index) => {
				// @ts-ignore
				if (item === organisationalUnitCode) {
					selectedOrganisations.splice(index, 1)
				}
			})

			res.locals.audience.departments = selectedOrganisations
			res.locals.audience.name = await this.audienceService.getAudienceName(res.locals.audience)
			await this.learningCatalogue
				.updateAudience(res.locals.course.id, res.locals.audience)
				.then(() => {
					res.redirect(`/content-management/courses/${req.params.courseId}/audiences/${req.params.audienceId}/organisation`)
				})
				.catch(error => {
					next(error)
				})
		}
	}

	private async getAllProfessions(): Promise<string[]> {
		const professions = await this.csrsService.getAreasOfWork()
		return professions.map((profession: any) => {
			return profession.name
		})
	}

	deleteAudienceConfirmation() {
		return async (req: Request, res: Response) => {
			res.render('page/course/audience/delete-audience-confirmation')
		}
	}

	deleteAudience() {
		return async (req: Request, res: Response, next: NextFunction) => {
			await this.learningCatalogue
				.deleteAudience(req.params.courseId, req.params.audienceId)
				.then(() => {
					res.redirect(`/content-management/courses/${req.params.courseId}/overview`)
				})
				.catch(error => {
					next(error)
				})
		}
	}

	getAreasOfWork() {
		return async (req: Request, res: Response) => {
			const areasOfWork = await this.csrsService.getAreasOfWork()

			for (let i = areasOfWork.length - 1; i >= 0; i--) {
				if (areasOfWork[i]['name'] == "I don't know") {
					areasOfWork.splice(i, 1)
				}
			}

			res.render('page/course/audience/add-area-of-work', {areasOfWork: areasOfWork})
		}
	}

	setAreasOfWork() {
		return async (req: Request, res: Response, next: NextFunction) => {
			const areaOfWork = req.body.areaOfWork === 'all' ? await this.getAllProfessions() : [req.body['parent']]

			const index = areaOfWork.indexOf("I don't know")
			if (index > -1) {
				areaOfWork.splice(index, 1)
			}

			res.locals.audience.areasOfWork = areaOfWork
			res.locals.audience.name = await this.audienceService.getAudienceName(res.locals.audience)

			await this.learningCatalogue
				.updateAudience(res.locals.course.id, res.locals.audience)
				.then(() => {
					res.redirect(`/content-management/courses/${req.params.courseId}/audiences/${req.params.audienceId}/configure`)
				})
				.catch(error => {
					next(error)
				})
		}
	}

	deleteAreasOfWork() {
		return async (req: Request, res: Response, next: NextFunction) => {
			res.locals.audience.areasOfWork = []
			res.locals.audience.name = await this.audienceService.getAudienceName(res.locals.audience)
			await this.learningCatalogue
				.updateAudience(res.locals.course.id, res.locals.audience)
				.then(() => res.redirect(`/content-management/courses/${req.params.courseId}/audiences/${req.params.audienceId}/configure`))
				.catch(error => next(error))
		}
	}

	getGrades() {
		return async (req: Request, res: Response) => {
			const grades = await this.csrsService.getGrades()
			res.render('page/course/audience/add-grades', {grades})
		}
	}

	setGrades() {
		return async (req: Request, res: Response, next: NextFunction) => {
			const gradeCodes = Array.isArray(req.body.grades) ? req.body.grades : [req.body.grades]
			if (gradeCodes && gradeCodes.length > 0) {
				const allGradesValid = await gradeCodes.reduce(
					async (allValid: boolean, gradeCode: string) => (allValid ? await this.csrsService.isGradeCodeValid(gradeCode) : false),
					true
				)
				if (allGradesValid) {
					res.locals.audience.grades = gradeCodes
					res.locals.audience.name = await this.audienceService.getAudienceName(res.locals.audience)
					await this.learningCatalogue
						.updateAudience(res.locals.course.id, res.locals.audience)
						.then(() => {
							res.redirect(`/content-management/courses/${req.params.courseId}/audiences/${req.params.audienceId}/configure`)
						})
						.catch(error => next(error))
				}
			} else {
				next(new Error('Grade not valid'))
			}
		}
	}

	deleteGrades() {
		return async (req: Request, res: Response, next: NextFunction) => {
			res.locals.audience.grades = []
			res.locals.audience.name = await this.audienceService.getAudienceName(res.locals.audience)
			await this.learningCatalogue
				.updateAudience(res.locals.course.id, res.locals.audience)
				.then(() => {
					res.redirect(`/content-management/courses/${req.params.courseId}/audiences/${req.params.audienceId}/configure`)
				})
				.catch(error => next(error))
		}
	}

	getCoreLearning() {
		return async (request: Request, response: Response) => {
			const interests = await this.csrsService.getCoreLearning()
			response.render('page/course/audience/add-core-learning', {interests})
		}
	}

	setCoreLearning() {
		return async (req: Request, res: Response, next: NextFunction) => {
			const interests = Array.isArray(req.body.interests) ? req.body.interests : [req.body.interests]
			if (interests) {
				const allInterestsValid = await interests.reduce(
					async (allValid: boolean, interest: string) => (allValid ? await this.csrsService.isCoreLearningValid(interest) : false),
					true
				)
				if (allInterestsValid) {
					res.locals.audience.interests = interests
					res.locals.audience.name = await this.audienceService.getAudienceName(res.locals.audience)
					await this.learningCatalogue
						.updateAudience(res.locals.course.id, res.locals.audience)
						.then(() => {
							res.redirect(`/content-management/courses/${req.params.courseId}/audiences/${req.params.audienceId}/configure`)
						})
						.catch(error => next(error))
				} else {
					next(new Error('Interests not valid'))
				}
			} else {
				next(new Error('Interests not present'))
			}
		}
	}

	deleteCoreLearning() {
		return async (req: Request, res: Response, next: NextFunction) => {
			res.locals.audience.interests = []

			await this.learningCatalogue
				.updateAudience(res.locals.course.id, res.locals.audience)
				.then(() => {
					res.redirect(`/content-management/courses/${req.params.courseId}/audiences/${req.params.audienceId}/configure`)
				})
				.catch(error => next(error))
		}
	}

	getPrivateCourseEvent() {
		return async (req: Request, res: Response) => {
			const courseEvents = this.courseService.getAllEventsOnCourse(res.locals.course).map((event: Event) => {
				event.dateRanges.sort((dr1: any, dr2: any) => (dr1.date < dr2.date ? -1 : dr1.date > dr2.date ? 1 : 0))
				return event
			})
			res.render('page/course/audience/add-event', {courseEvents})
		}
	}

	setPrivateCourseEvent() {
		return async (req: Request, res: Response) => {
			const eventId = req.body.events
			if (eventId) {
				const event = this.courseService.getAllEventsOnCourse(res.locals.course).find((event: Event) => event.id == eventId)
				if (event) {
					res.locals.audience.eventId = eventId
					await this.learningCatalogue.updateCourse(res.locals.course)
				}
			}
			res.redirect(`/content-management/courses/${req.params.courseId}/audiences/${req.params.audienceId}/configure`)
		}
	}

	deletePrivateCourseEvent() {
		return async (req: Request, res: Response) => {
			res.locals.audience.eventId = undefined
			await this.learningCatalogue.updateCourse(res.locals.course)

			res.redirect(`/content-management/courses/${req.params.courseId}/audiences/${req.params.audienceId}/configure`)
		}
	}

	deleteRequiredLearning() {
		return async (req: Request, res: Response, next: NextFunction) => {
			res.locals.audience.type = Audience.Type.OPEN
			res.locals.audience.requiredBy = undefined
			res.locals.audience.frequency = undefined

			await this.learningCatalogue
				.updateAudience(res.locals.course.id, res.locals.audience)
				.then(() => {
					res.redirect(`/content-management/courses/${req.params.courseId}/audiences/${req.params.audienceId}/configure`)
				})
				.catch(error => next(error))
		}
	}

	getRequiredLearning() {
		return async (req: Request, res: Response) => {
			res.render('page/course/audience/add-required-learning', {exampleYear: new Date(Date.now()).getFullYear() + 1})
		}
	}

	setRequiredLearning() {
		return async (req: Request, res: Response, next: NextFunction) => {
			const data = {
				...req.body,
			}

			if (data.year || data.month || data.day) {
				res.locals.audience.requiredBy = DateTime.yearMonthDayToDate(data.year, data.month, data.day).toDate()
			}
			res.locals.audience.type = Audience.Type.REQUIRED_LEARNING

			const years = data.years ? parseInt(data.years) : 0
			const months = data.months ? parseInt(data.months) : 0
			if (data.years || data.months) {
				res.locals.audience.frequency = moment.duration(years * 12 + months, 'months')
			}

			await this.learningCatalogue.updateCourse(res.locals.course)

			res.redirect(`/content-management/courses/${req.params.courseId}/audiences/${req.params.audienceId}/configure`)
		}
	}
}
