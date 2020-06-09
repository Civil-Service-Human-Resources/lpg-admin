import {NextFunction, Request, Response, Router} from 'express'
import {ReportService} from '../report-service'
import moment = require('moment')
import {DateStartEndCommandFactory} from './command/factory/dateStartEndCommandFactory'
import {DateStartEndCommand} from './command/dateStartEndCommand'
import {DateStartEnd} from '../learning-catalogue/model/dateStartEnd'
import {Validator} from '../learning-catalogue/validator/validator'
import {PlaceholderDate} from '../learning-catalogue/model/placeholderDate'

export class ReportingController {
	router: Router
	reportService: ReportService
	dateStartEndCommandFactory: DateStartEndCommandFactory
	dateStartEndCommandValidator: Validator<DateStartEndCommand>
	dateStartEndValidator: Validator<DateStartEnd>

	constructor(
		reportService: ReportService,
		dateStartEndCommandFactory: DateStartEndCommandFactory,
		dateStartEndCommandValidator: Validator<DateStartEndCommand>,
		dateStartEndValidator: Validator<DateStartEnd>
	) {
		this.router = Router()
		this.configureRouterPaths()
		this.reportService = reportService
		this.dateStartEndCommandFactory = dateStartEndCommandFactory
		this.dateStartEndCommandValidator = dateStartEndCommandValidator
		this.dateStartEndValidator = dateStartEndValidator
	}

	private configureRouterPaths() {
		this.router.get('/reporting', this.getReports())
		this.router.post('/reporting/booking-information', this.generateReportBookingInformation())
		this.router.post('/reporting/learner-record/module', this.generateReportLearnerRecordForModule())
		this.router.post('/reporting/learner-record/mandatorycourses', this.generateReportForMandatoryCourses())
	}

	getReports() {
		return async (request: Request, response: Response) => {
			response.render('page/reporting/index', {
				placeholder: new PlaceholderDate(),
			})
		}
	}

	generateReportBookingInformation() {
		return async (request: Request, response: Response, next: NextFunction) => {
			const reportType = 'Booking_information_'
			const filename = reportType.concat(moment().toISOString())

			let data = {
				...request.body,
			}

			const dateRangeCommand: DateStartEndCommand = this.dateStartEndCommandFactory.create(data)
			const dateRange: DateStartEnd = dateRangeCommand.asDateRange()

			const errors = await this.dateStartEndValidator.check(dateRange)
			if (errors.size) {
				request.session!.sessionFlash = {errors}
				request.session!.save(() => {
					response.redirect(`/reporting`)
				})
			} else {
				try {
					await this.reportService
						.getReportBookingInformation(dateRange)
						.then(report => {
							response.writeHead(200, {
								'Content-type': 'text/csv',
								'Content-disposition': `attachment;filename=${filename}.csv`,
								'Content-length': report.length,
							})
							response.end(Buffer.from(report, 'binary'))
						})
						.catch(error => {
							next(error)
						})
				} catch (error) {
					throw new Error(error)
				}
			}
		}
	}

	generateReportLearnerRecordForModule() {
		return async (request: Request, response: Response, next: NextFunction) => {
			const reportType = 'Learner_record_'
			const filename = reportType.concat(moment().toISOString())

			let data = {
				...request.body,
			}

			const dateRangeCommand: DateStartEndCommand = this.dateStartEndCommandFactory.create(data)
			const dateRange: DateStartEnd = dateRangeCommand.asDateRange()

			const errors = await this.dateStartEndValidator.check(dateRange)

			if (errors.size) {
				request.session!.sessionFlash = {errors}
				request.session!.save(() => {
					response.redirect(`/reporting`)
				})
			} else {
				try {
					await this.reportService
						.getReportLearnerRecord(dateRange)
						.then(report => {
							response.writeHead(200, {
								'Content-type': 'text/csv',
								'Content-disposition': `attachment;filename=${filename}.csv`,
								'Content-length': report.length,
							})
							response.end(Buffer.from(report, 'binary'))
						})
						.catch(error => {
							next(error)
						})
				} catch (error) {
					throw new Error(error)
				}
			}
		}
	}

	generateReportForMandatoryCourses() {
		return async (request: Request, response: Response, next: NextFunction) => {
			const reportType = 'Learner_record_'
			const filename = reportType.concat(moment().toISOString())

			let data = {
				...request.body,
			}

			const dateRangeCommand: DateStartEndCommand = this.dateStartEndCommandFactory.create(data)
			const dateRange: DateStartEnd = dateRangeCommand.asDateRange()

			const errors = await this.dateStartEndValidator.check(dateRange)

			if (errors.size) {
				request.session!.sessionFlash = {errors}
				request.session!.save(() => {
					response.redirect(`/reporting`)
				})
			} else {
				try {
					await this.reportService
						.getReportForMandatoryCourses(dateRange)
						.then(report => {
							response.writeHead(200, {
								'Content-type': 'text/csv',
								'Content-disposition': `attachment;filename=${filename}.csv`,
								'Content-length': report.length,
							})
							response.end(Buffer.from(report, 'binary'))
						})
						.catch(error => {
							next(error)
						})
				} catch (error) {
					throw new Error(error)
				}
			}
		}
	}
}
