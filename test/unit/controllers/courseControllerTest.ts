import {beforeEach, describe, it} from 'mocha'
import {mockReq, mockRes} from 'sinon-express-mock'
import * as chai from 'chai'
import * as sinonChai from 'sinon-chai'
import {expect} from 'chai'
import {Request, Response} from 'express'
import {LearningCatalogue} from '../../../src/learning-catalogue'
import {Course} from '../../../src/learning-catalogue/model/course'
import * as sinon from 'sinon'
import {CourseController} from '../../../src/controllers/courseController'
import {CourseFactory} from '../../../src/learning-catalogue/model/factory/courseFactory'
import {ContentRequest} from '../../../src/extended'
import {Validator} from '../../../src/learning-catalogue/validator/validator'

chai.use(sinonChai)

describe('Course Controller Tests', function() {
	let courseController: CourseController
	let learningCatalogue: LearningCatalogue
	let courseValidator: Validator<Course>
	let courseFactory: CourseFactory

	beforeEach(() => {
		learningCatalogue = <LearningCatalogue>{}
		courseValidator = <Validator<Course>>{}
		courseFactory = <CourseFactory>{}

		courseController = new CourseController(learningCatalogue, courseValidator, courseFactory)
	})

	it('should call course overview page', async function() {
		const courseOverview: (request: Request, response: Response) => void = courseController.courseOverview()

		const request: Request = mockReq()
		const response: Response = mockRes()

		await courseOverview(request, response)

		expect(response.render).to.have.been.calledOnceWith('page/course')
	})

	it('should call course preview page', async function() {
		const course: Course = new Course()

		const coursePreview: (request: Request, response: Response) => void = courseController.coursePreview()

		const request: Request = mockReq()
		const response: Response = mockRes()

		const req = request as ContentRequest
		req.course = course

		await coursePreview(request, response)

		expect(response.render).to.have.been.calledOnceWith('page/course-preview')
	})

	it('should render add-course-title page', async function() {
		const getCourseTitle: (request: Request, response: Response) => void = courseController.getCourseTitle()

		const request: Request = mockReq()
		const response: Response = mockRes()

		await getCourseTitle(request, response)

		expect(response.render).to.have.been.calledWith('page/add-course-title')
	})

	it('should check for title errors and redirect to details page if no errors', async function() {
		const setCourseTitle: (request: Request, response: Response) => void = courseController.setCourseTitle()

		const request: Request = mockReq()
		const response: Response = mockRes()

		courseValidator.check = sinon.stub().returns({fields: [], size: 0})

		const errors = {fields: [], size: 0}

		const course = new Course()
		course.title = 'New Course'

		courseFactory.create = sinon.stub().returns(course)

		await setCourseTitle(request, response)

		expect(courseValidator.check).to.have.been.calledWith(request.body, ['title'])
		expect(courseValidator.check).to.have.returned(errors)
		expect(request.session!.sessionFlash.course).to.be.equal(course)
		expect(response.redirect).to.have.been.calledWith('/content-management/add-course-details')
	})

	it('should check for title errors and render title page with errors if errors present', async function() {
		const setCourseTitle: (request: Request, response: Response) => void = courseController.setCourseTitle()

		const request: Request = mockReq()
		const response: Response = mockRes()

		request.body = {title: ''}

		const errors = {fields: ['validation.course.title.empty'], size: 1}
		courseValidator.check = sinon.stub().returns(errors)

		await setCourseTitle(request, response)

		expect(courseValidator.check).to.have.been.calledWith(request.body, ['title'])
		expect(courseValidator.check).to.have.returned(errors)
		expect(request.session!.sessionFlash.errors).to.be.equal(errors)
		expect(response.redirect).to.have.been.calledWith('/content-management/add-course')
	})

	it('should edit title', async function() {
		const setCourseTitle: (request: Request, response: Response) => void = courseController.setCourseTitle()

		const request: Request = mockReq()
		const response: Response = mockRes()

		request.body = {title: ''}
		request.params.courseId = 'abc123'

		const course = new Course()
		course.title = 'New Course'
		course.id = 'abc123'
		response.locals.course = course

		const errors = {fields: [], size: 0}
		courseValidator.check = sinon.stub().returns(errors)

		courseFactory.create = sinon.stub().returns(course)
		learningCatalogue.updateCourse = sinon.stub().returns(course)

		await setCourseTitle(request, response)

		expect(courseValidator.check).to.have.been.calledWith(request.body, ['title'])
		expect(response.redirect).to.have.been.calledWith(
			`/content-management/course-preview/${request.params.courseId}`
		)
	})

	it('should render add-course-details page', async function() {
		const getCourseDetails: (request: Request, response: Response) => void = courseController.getCourseDetails()

		const request: Request = mockReq()
		const response: Response = mockRes()

		await getCourseDetails(request, response)

		expect(response.render).to.have.been.calledWith('page/add-course-details')
	})

	it('should check for details errors and redirect to content-management page if no errors', async function() {
		const setCourseDetails: (request: Request, response: Response) => void = courseController.setCourseDetails()

		const request: Request = mockReq()
		const response: Response = mockRes()

		request.body = {
			title: 'New Course',
			description: 'desc',
			shortDescription: 'short',
			learningOutcomes: 'outcomes',
		}

		const course = new Course()
		learningCatalogue.createCourse = sinon.stub().returns('123')

		courseFactory.create = sinon.stub().returns(course)

		const errors = {fields: [], size: 0}
		courseValidator.check = sinon.stub().returns(errors)

		await setCourseDetails(request, response)

		expect(courseFactory.create).to.have.been.calledWith(request.body)
		expect(courseValidator.check).to.have.been.calledWith(course)
		expect(courseValidator.check).to.have.returned(errors)
		expect(learningCatalogue.createCourse).to.have.been.calledWith(course)
		expect(request.session!.sessionFlash).to.contain({courseAddedSuccessMessage: 'course_added_success_message'})

		expect(response.redirect).to.have.been.calledWith(`/content-management/course/${course.id}`)
	})

	it('should check for description errors and render add-course-details if errors present', async function() {
		const setCourseDetails: (request: Request, response: Response) => void = courseController.setCourseDetails()

		const request: Request = mockReq()
		const response: Response = mockRes()

		request.body = {
			title: 'New Course',
			description: 'desc',
			shortDescription: 'short',
			learningOutcomes: 'outcomes',
		}

		const course = new Course()
		learningCatalogue.createCourse = sinon.stub().returns('123')
		courseFactory.create = sinon.stub().returns(course)

		const errors = {
			fields: ['validation.course.description.empty'],
			size: 1,
		}

		courseValidator.check = sinon.stub().returns(errors)

		await setCourseDetails(request, response)

		expect(courseFactory.create).to.have.been.calledWith(request.body)
		expect(courseValidator.check).to.have.been.calledWith(course)
		expect(courseValidator.check).to.have.returned(errors)
		expect(request.session!.sessionFlash.errors).to.be.equal(errors)
		expect(request.session!.sessionFlash.course).to.be.equal(course)
		expect(request.session!.sessionFlash).to.not.contain({
			courseAddedSuccessMessage: 'course_added_success_message',
		})
		expect(response.redirect).to.have.been.calledWith('/content-management/add-course-details')
	})

	it('should edit course details', async function() {
		const setCourseDetails: (request: Request, response: Response) => void = courseController.setCourseDetails()

		const request: Request = mockReq()
		const response: Response = mockRes()

		request.params.courseId = 'abc123'

		const course = new Course()
		course.title = 'New Course'
		course.id = 'abc123'
		response.locals.course = course

		const errors = {fields: [], size: 0}
		courseValidator.check = sinon.stub().returns(errors)

		courseFactory.create = sinon.stub().returns(course)
		learningCatalogue.updateCourse = sinon.stub().returns(course)

		await setCourseDetails(request, response)

		expect(courseValidator.check).to.have.been.calledWith(course)
		expect(response.redirect).to.have.been.calledWith(
			`/content-management/course-preview/${request.params.courseId}`
		)
	})
})
