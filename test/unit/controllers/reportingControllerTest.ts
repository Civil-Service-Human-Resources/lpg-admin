// import {beforeEach, describe, it} from 'mocha'
// import {ReportingController} from '../../../src/controllers/reportingController'
// import {mockReq, mockRes} from 'sinon-express-mock'
// import * as chai from 'chai'
// import * as sinonChai from 'sinon-chai'
// import {expect} from 'chai'
// import {NextFunction, Request, Response} from 'express'
// import {ReportService} from '../../../src/report-service'
// import * as sinon from 'sinon'
// import {Validator} from '../../../src/learning-catalogue/validator/validator'
// import {DateStartEndCommand} from '../../../src/controllers/command/dateStartEndCommand'
//
// chai.use(sinonChai)
//
// describe('Reporting Controller Tests', function() {
// 	let reportingController: ReportingController
// 	let reportService: ReportService
// 	let next: NextFunction
// 	let dateRangeCommandValidator: Validator<DateStartEndCommand>
//
// 	beforeEach(() => {
// 		next = sinon.stub()
// 		reportService = <ReportService>{}
// 		dateStartEndCommandValidator: <Validator<DateStartEndCommand>>{}
//
// 		reportingController = new ReportingController(reportService, dateRangeCommandValidator)
// 	})
//
// 	it('should render reporting home page', async function() {
// 		const getReports: (req: Request, res: Response) => void = reportingController.getReports()
//
// 		const req: Request = mockReq()
//
// 		const res: Response = mockRes()
//
// 		await getReports(req, res)
//
// 		expect(res.render).to.have.been.calledOnceWith('page/reporting/index')
// 	})
//
// 	it('should generate booking information report', async () => {
// 		const getReports: (req: Request, res: Response, next: NextFunction) => void = reportingController.generateReportBookingInformation()
//
// 		const req: Request = mockReq({
// 			query: {
// 				'report-type': 'booking-information',
// 				'from-year': '2018',
// 				'from-month': '1',
// 				'from-to': '1',
// 				'to-year': '2019',
// 				'to-month': '1',
// 				'to-day': '22',
// 			},
// 		})
//
// 		const data = 'a,b,c'
//
// 		reportService.getReportBookingInformation = sinon.stub().returns(Promise.resolve(data))
//
// 		const res: Response = mockRes()
//
// 		res.writeHead = sinon.stub()
//
// 		await getReports(req, res, next)
//
// 		expect(res.end).to.have.been.calledOnceWith(Buffer.from(data, 'binary'))
// 	})
//
// 	it('should generate learner record report', async () => {
// 		const getReports: (req: Request, res: Response, next: NextFunction) => void = reportingController.generateReportLearnerRecord()
//
// 		const req: Request = mockReq({
// 			query: {
// 				'report-type': 'booking-information',
// 				'from-year': '2018',
// 				'from-month': '1',
// 				'from-to': '1',
// 				'to-year': '2019',
// 				'to-month': '1',
// 				'to-day': '22',
// 			},
// 		})
//
// 		const data = 'a,b,c'
//
// 		reportService.getReportLearnerRecord = sinon.stub().returns(Promise.resolve(data))
//
// 		const res: Response = mockRes()
//
// 		res.writeHead = sinon.stub()
//
// 		await getReports(req, res, next)
//
// 		expect(res.end).to.have.been.calledOnceWith(Buffer.from(data, 'binary'))
// 	})
// })
