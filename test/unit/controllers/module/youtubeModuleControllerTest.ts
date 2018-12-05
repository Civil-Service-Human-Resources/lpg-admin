import * as chai from 'chai'
import {expect} from 'chai'
import * as sinonChai from 'sinon-chai'
import {YoutubeModuleController} from '../../../../src/controllers/module/youtubeModuleController'
import {ModuleFactory} from '../../../../src/learning-catalogue/model/factory/moduleFactory'
import {LearningCatalogue} from '../../../../src/learning-catalogue'
import {mockReq, mockRes} from 'sinon-express-mock'
import * as sinon from 'sinon'
import {Course} from '../../../../src/learning-catalogue/model/course'
import {Request, Response} from 'express'
import {Module} from '../../../../src/learning-catalogue/model/module'
import {Validator} from '../../../../src/learning-catalogue/validator/validator'
import {YoutubeService} from '../../../../src/youtube/youtubeService'

chai.use(sinonChai)

describe('YoutubeService Module Controller Test', function() {
	let youtubeModuleController: YoutubeModuleController
	let learningCatalogue: LearningCatalogue
	let moduleValidator: Validator<Module>
	let moduleFactory: ModuleFactory
	let youtubeService: YoutubeService

	let youtubeResponse = {
		status: 200,
		data: {
			type: 'video',
			html: '<iframe width="560" height="315" src="https://www.youtubeService.com/embed/example"',
			items: [
				{
					contentDetails: {
						duration: 'PT10H1M26S',
					},
				},
			],
		},
	}

	let req: Request
	let res: Response

	beforeEach(() => {
		learningCatalogue = <LearningCatalogue>{}
		moduleValidator = <Validator<Module>>{}
		moduleFactory = <ModuleFactory>{}
		youtubeService = <YoutubeService>{}

		youtubeModuleController = new YoutubeModuleController(learningCatalogue, moduleValidator, moduleFactory, youtubeService)

		req = mockReq()
		res = mockRes()

		req.session!.save = callback => {
			callback(undefined)
		}
	})

	it('should render youtubeService module page', async function() {
		await youtubeModuleController.getModule()(req, res)
		expect(res.render).to.have.been.calledOnceWith('page/course/module/module-youtube')
	})

	it('should check for errors and redirect to course preview page', async function() {
		const url = 'https://www.youtubeService.com/example'
		req.body.url = url
		const courseId = 'abc'
		const course: Course = new Course()
		course.id = courseId
		res.locals.course = course
		const module: Module = new Module()

		moduleValidator.check = sinon.stub().returns({fields: [], size: 0})
		moduleFactory.create = sinon.stub().returns(module)
		learningCatalogue.createModule = sinon.stub()
		youtubeService.getYoutubeResponse = sinon.stub().returns(youtubeResponse)
		youtubeService.checkYoutubeResponse = sinon.stub().returns(true)
		youtubeService.getBasicYoutubeInfo = sinon.stub().returns(youtubeResponse)
		youtubeService.getDuration = sinon.stub().returns(1)

		await youtubeModuleController.setModule()(req, res)

		expect(moduleFactory.create).to.have.been.calledTwice
		expect(youtubeService.getYoutubeResponse).to.have.been.calledOnceWith(url)
		expect(youtubeService.checkYoutubeResponse).to.have.been.calledOnceWith(youtubeResponse)
		expect(youtubeService.getBasicYoutubeInfo).to.have.been.calledOnceWith(youtubeResponse)
		expect(youtubeService.getDuration).to.have.been.calledOnce
		expect(learningCatalogue.createModule).to.have.been.calledWith(courseId, module)
		expect(res.redirect).to.have.been.calledWith('/content-management/courses/abc/preview')
	})

	it('should check for and find errors and redirect to course preview page', async function() {
		const course: Course = new Course()
		course.id = 'abc'
		res.locals.course = course

		moduleValidator.check = sinon.stub().returns({fields: ['validation.course.title.empty'], size: 1})
		moduleFactory.create = sinon.stub().returns(module)
		youtubeService.getYoutubeResponse = sinon.stub().returns(undefined)

		await youtubeModuleController.setModule()(req, res)

		expect(moduleFactory.create).to.have.been.calledOnce
		expect(youtubeService.getYoutubeResponse).to.have.been.calledOnce
		expect(res.redirect).to.have.been.calledOnceWith(`/content-management/courses/abc/module-video`)
	})

	it('should get video duration and redirect to course preview page', async function() {
		const courseId = 'abc'
		const course: Course = new Course()
		course.id = courseId
		res.locals.course = course
		const url = 'https://www.youtubeService.com/example'
		req.params.courseId = courseId
		req.body.url = url

		moduleValidator.check = sinon.stub().returns({fields: [], size: 0})

		youtubeService.getYoutubeResponse = sinon.stub().returns(youtubeResponse)
		youtubeService.checkYoutubeResponse = sinon.stub().returns(true)
		youtubeService.getBasicYoutubeInfo = sinon.stub().returns(youtubeResponse.data)
		youtubeService.getDuration = sinon.stub().returns(0)

		moduleFactory.create = sinon.stub().returns(module)

		await youtubeModuleController.setModule()(req, res)

		expect(moduleFactory.create).to.have.been.calledOnce
		expect(youtubeService.getYoutubeResponse).to.have.been.calledOnceWith(url)
		expect(youtubeService.checkYoutubeResponse).to.have.been.calledOnceWith(youtubeResponse)
		expect(youtubeService.getBasicYoutubeInfo).to.have.been.calledOnceWith(youtubeResponse)
		expect(youtubeService.getDuration).to.have.been.calledOnce
		expect(res.redirect).to.have.been.calledOnceWith(`/content-management/courses/abc/module-video`)
	})
})
