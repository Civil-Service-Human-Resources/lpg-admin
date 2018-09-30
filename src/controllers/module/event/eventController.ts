import {LearningCatalogue} from '../../../learning-catalogue/index'
import {Validator} from '../../../learning-catalogue/validator/validator'
import {Request, Response, Router} from 'express'
import {EventFactory} from '../../../learning-catalogue/model/factory/eventFactory'
import {Event} from '../../../learning-catalogue/model/event'
import * as datetime from '../../../lib/datetime'
import * as moment from 'moment'
import {DateRangeCommand} from '../../command/dateRangeCommand'
import {DateRange} from '../../../learning-catalogue/model/dateRange'
import {DateRangeCommandFactory} from '../../command/factory/dateRangeCommandFactory'

export class EventController {
	learningCatalogue: LearningCatalogue
	eventValidator: Validator<Event>
	eventFactory: EventFactory
	dateRangeCommandValidator: Validator<DateRangeCommand>
	dateRangeValidator: Validator<DateRange>
	dateRangeCommandFactory: DateRangeCommandFactory
	router: Router

	constructor(learningCatalogue: LearningCatalogue, eventValidator: Validator<Event>, eventFactory: EventFactory,
	            dateRangeCommandValidator: Validator<DateRangeCommand>, dateRangeValidator: Validator<DateRange>,
	            dateRangeCommandFactory: DateRangeCommandFactory) {
		this.learningCatalogue = learningCatalogue
		this.eventValidator = eventValidator
		this.eventFactory = eventFactory
		this.dateRangeCommandValidator = dateRangeCommandValidator
		this.dateRangeValidator = dateRangeValidator
		this.dateRangeCommandFactory = dateRangeCommandFactory
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

		this.router.param('moduleId', async (req, res, next, moduleId) => {
			const module = await this.learningCatalogue.getModule(res.locals.course.id, moduleId)

			if (module) {
				res.locals.module = module
				next()
			} else {
				res.sendStatus(404)
			}
		})

		this.router.param('eventId', async (req, res, next, eventId) => {
			const event = await this.learningCatalogue.getEvent(res.locals.course.id, res.locals.module.id, eventId)

			if (event) {
				res.locals.event = event
				next()
			} else {
				res.sendStatus(404)
			}
		})

		this.router.param('courseId', async (req, res, next, courseId) => {
			const date = new Date(Date.now())
			res.locals.exampleYear = date.getFullYear() + 1
			next()
		})

		this.router.post(
			'/content-management/courses/:courseId/modules/:moduleId/events/location/create',
			this.getLocation()
		)
		this.router.post(
			'/content-management/courses/:courseId/modules/:moduleId/events/location/:eventId?',
			this.setLocation()
		)

		this.router.get('/content-management/courses/:courseId/modules/:moduleId/events/:eventId?', this.getDateTime())
		this.router.post('/content-management/courses/:courseId/modules/:moduleId/events/:eventId?', this.setDateTime())
		this.router.get(
			'/content-management/courses/:courseId/modules/:moduleId/events-preview/:eventId?',
			this.getDatePreview()
		)
		this.router.get(
			'/content-management/courses/:courseId/modules/:moduleId/events-overview/:eventId',
			this.getEventOverview()
		)

		this.router.get('/content-management/courses/:courseId/modules/:moduleId/events/:eventId/dateRanges/:dateRangeIndex',
			this.editDateRange()
		)

		this.router.post('/content-management/courses/:courseId/modules/:moduleId/events/:eventId/dateRanges/:dateRangeIndex',
			this.updateDateRange()
		)
	}

	public getDateTime() {
		return async (request: Request, response: Response) => {
			response.render('page/course/module/events/events')
		}
	}

	public setDateTime() {
		return async (request: Request, response: Response) => {
			let data = {
				...request.body,
			}
			const event = (data.eventJson) ? JSON.parse(data.eventJson) : this.eventFactory.create({})
			let errors = await this.dateRangeCommandValidator.check(data)

			if (errors.size) {
				response.render('page/course/module/events/events', {
					event: event,
					eventJson: JSON.stringify(event),
					errors: errors
				})
			} else {
				const dateRangeCommand: DateRangeCommand = this.dateRangeCommandFactory.create(data)
				const dateRange: DateRange = dateRangeCommand.asDateRange()

				errors = await this.dateRangeValidator.check(dateRange)

				if (errors.size) {
					const event = (data.eventJson) ? JSON.parse(data.eventJson) : this.eventFactory.create({})
					response.render('page/course/module/events/events', {
						event: event,
						eventJson: JSON.stringify(event),
						errors: errors,
					})

				} else {
					const event = (data.eventJson) ? JSON.parse(data.eventJson) : this.eventFactory.create({})
					event.dateRanges.push(dateRange)

					response.render('page/course/module/events/events', {
						event: event,
						eventJson: JSON.stringify(event),
					})
				}
			}
		}
	}

	public editDateRange() {
		return async (request: Request, response: Response) => {
			// const courseId = request.params.courseId
			// const moduleId = request.params.moduleId
			// const eventId = request.params.eventId
			const dateRangeIndex = request.params.dateRangeIndex

			// const event = await this.learningCatalogue.getEvent(courseId, moduleId, eventId)
			const event = response.locals.event

			const dateRange = event!.dateRanges![dateRangeIndex]

			const date: any = moment(dateRange.date)

			const startTime = moment(dateRange.startTime, 'HH:mm')
			const endTime = moment(dateRange.endTime, 'HH:mm')

			response.render('page/course/module/events/event-dateRange-edit', {
				day: date.date(),
				month : date.month() + 1,
				year: date.year(),
				startHours: startTime.format('HH'),
				startMinutes: startTime.format('mm'),
				endHours: endTime.format('HH'),
				endMinutes: endTime.format('mm'),
				dateRangeIndex: dateRangeIndex
			})
		}
	}

	public updateDateRange() {
		return async (request: Request, response: Response) => {
			let data = {
				...request.body,
			}


			const courseId = request.params.courseId
			const moduleId = request.params.moduleId
			const eventId = request.params.eventId
			const dateRangeIndex = request.params.dateRangeIndex

			// validate form

			const event = await this.learningCatalogue.getEvent(courseId, moduleId, eventId)

			const date = moment([data.year, data.month -1, data.day]).format('YYYY-MM-DD')

			const startTime = moment([data.startTime[0], data.startTime[1]], 'HH:mm').format('HH:mm')
			const endTime = moment([data.endTime[0], data.endTime[1]], 'HH:mm').format('HH:mm')

			event!.dateRanges![dateRangeIndex].date = date
			event!.dateRanges![dateRangeIndex].startTime = startTime
			event!.dateRanges![dateRangeIndex].endTime = endTime

			// validate dateRange

			this.learningCatalogue.updateEvent(courseId, moduleId, eventId, event)

			request.session!.event = event
			request.session!.save(() => {
				response.redirect(`/content-management/courses/${courseId}/modules/${moduleId}/events/${eventId}`)
			})
		}
	}

	public getDatePreview() {
		return async (request: Request, response: Response) => {
			response.render('page/course/module/events/events-preview')
		}
	}

	public getLocation() {
		return async (req: Request, res: Response) => {
			res.render('page/course/module/events/event-location', {
				event: JSON.parse(req.body.eventJson || '{}'),
				eventJson: req.body.eventJson
			})
		}
	}

	public setLocation() {
		return async (req: Request, res: Response) => {
			const data = {
				venue: {
					location: req.body.location,
					address: req.body.address,
					capacity: parseInt(req.body.capacity, 10),
					minCapacity: parseInt(req.body.minCapacity, 10),
				},
			}

			const errors = await this.eventValidator.check(data, ['event.location'])

			if (errors.size) {
				res.render('page/course/module/events/event-location', {
					eventJson: req.body.eventJson,
					errors: errors
				})
			} else {
				let event = JSON.parse(req.body.eventJson || '{}')
				event.venue = data.venue

				const savedEvent = await this.learningCatalogue.createEvent(
					req.params.courseId,
					req.params.moduleId,
					event
				)
				res.redirect(
					`/content-management/courses/${req.params.courseId}/modules/${req.params.moduleId}/events-overview/${savedEvent.id}`
				)
			}
		}
	}

	public getEventOverview() {
		return async (req: Request, res: Response) => {
			const event = res.locals.event
			const eventDateWithMonthAsText: string = datetime.convertDate(event.dateRanges[0].date)
			res.render('page/course/module/events/events-overview', {eventDateWithMonthAsText})
		}
	}
}
