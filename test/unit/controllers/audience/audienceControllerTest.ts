import * as chai from 'chai'
import {expect} from 'chai'
import * as sinonChai from 'sinon-chai'
import * as sinon from 'sinon'
import {beforeEach, describe} from 'mocha'
import {LearningCatalogue} from '../../../../src/learning-catalogue'
import {Validator} from '../../../../src/learning-catalogue/validator/validator'
import {AudienceController} from '../../../../src/controllers/audience/audienceController'
import {AudienceFactory} from '../../../../src/learning-catalogue/model/factory/audienceFactory'
import {Audience} from '../../../../src/learning-catalogue/model/audience'
import {mockReq, mockRes} from 'sinon-express-mock'
import {Request, Response} from 'express'
import {CourseService} from '../../../../src/lib/courseService'
import {AudienceService} from '../../../../src/lib/audienceService'
import {CsrsService} from '../../../../src/csrs/service/csrsService'

chai.use(sinonChai)

describe('AudienceController', function() {
	let audienceController: AudienceController
	let learningCatalogue: LearningCatalogue
	let audienceValidator: Validator<Audience>
	let audienceFactory: AudienceFactory
	let csrsService: CsrsService
	let req: Request
	let res: Response

	beforeEach(() => {
		learningCatalogue = <LearningCatalogue>{}
		audienceValidator = <Validator<Audience>>{}
		audienceFactory = <AudienceFactory>{}
		csrsService = <CsrsService>{}
		audienceController = new AudienceController(
			learningCatalogue,
			audienceValidator,
			audienceFactory,
			new CourseService(learningCatalogue),
			new AudienceService(learningCatalogue),
			csrsService
		)

		req = mockReq()
		req.session!.save = callback => {
			callback(undefined)
		}
		res = mockRes()
	})

	describe('#getAudienceName', function() {
		it('should render audience-name page', async function() {
			await audienceController.getAudienceName()(req, res)

			expect(res.render).to.have.been.calledOnceWith('page/course/audience/audience-name')
		})
	})

	describe('#setAudienceName', function() {
		it('should redirect back to audience name page if validation error', async function() {
			req.params.courseId = 'course-id'
			req.body = {name: ''}

			const errors = {size: 1}
			audienceValidator.check = sinon.stub().returns(errors)
			audienceFactory.create = sinon.stub().returns({})

			await audienceController.setAudienceName()(req, res)

			expect(audienceValidator.check).to.have.been.calledWith(req.body, ['audience.name'])
			expect(audienceValidator.check).to.have.returned(errors)
			expect(req.session!.sessionFlash.errors).to.be.equal(errors)
			expect(res.redirect).to.have.been.calledWith(`/content-management/courses/${req.params.courseId}/audiences`)
		})

		it('should redirect to audience type page if audience name validated successfully', async function() {
			req.params.courseId = 'course-id'
			req.body = {name: 'audience name'}

			const errors = {size: 0}
			audienceValidator.check = sinon.stub().returns(errors)
			const audience = <Audience>{}
			audienceFactory.create = sinon.stub().returns(audience)
			learningCatalogue.createAudience = sinon.stub()

			await audienceController.setAudienceName()(req, res)

			expect(audienceValidator.check).to.have.been.calledWith(req.body, ['audience.name'])
			expect(audienceValidator.check).to.have.returned(errors)
			Object.is(req.session!.sessionFlash.errors, undefined)
			expect(res.redirect).to.have.been.calledWith(
				`/content-management/courses/${req.params.courseId}/audiences/type`
			)
		})
	})

	describe('#getAudienceType', function() {
		it('should render audience-type page', async function() {
			await audienceController.getAudienceType()(req, res)

			expect(res.render).to.have.been.calledOnceWith('page/course/audience/audience-type')
		})
	})

	describe('#setAudienceType', function() {
		it('should redirect back to audience type page if validation error', async function() {
			const courseId = 'course-id'
			req.params.courseId = courseId
			req.body = {type: ''}

			const errors = {size: 1}
			audienceValidator.check = sinon.stub().returns(errors)
			audienceFactory.create = sinon.stub().returns({})

			await audienceController.setAudienceType()(req, res)

			expect(audienceValidator.check).to.have.been.calledWith(req.body, ['audience.type'])
			expect(audienceValidator.check).to.have.returned(errors)
			expect(req.session!.sessionFlash.errors).to.be.equal(errors)
			expect(res.redirect).to.have.been.calledWith(`/content-management/courses/${courseId}/audiences/type`)
		})

		it('should redirect to audience configuration page if audience created successfully', async function() {
			const courseId = 'course-id'
			req.params.courseId = courseId
			req.body = {name: 'audience name', type: 'OPEN'}

			const errors = {size: 0}
			audienceValidator.check = sinon.stub().returns(errors)
			const audience = <Audience>{}
			audienceFactory.create = sinon.stub().returns(audience)
			const newAudienceId = 'new-audience-id'
			learningCatalogue.createAudience = sinon.stub().returns({id: newAudienceId})

			await audienceController.setAudienceType()(req, res)

			expect(audienceValidator.check).to.have.been.calledWith(req.body, ['audience.type'])
			expect(audienceValidator.check).to.have.returned(errors)
			Object.is(req.session!.sessionFlash.errors, undefined)
			expect(learningCatalogue.createAudience).to.have.been.calledOnceWith(courseId, audience)
			expect(res.redirect).to.have.been.calledWith(
				`/content-management/courses/${courseId}/audiences/${newAudienceId}/configure`
			)
		})
	})

	describe('#getConfigureAudience', function() {
		it('should render audience configuration page', async function() {
			const courseId = 'course-id'
			const audienceId = 'audience-id'
			req.params.courseId = courseId
			req.params.audienceId = audienceId
			res.locals.audience = {departments: []}

			csrsService.getOrganisations = sinon.stub()

			await audienceController.getConfigureAudience()(req, res)

			expect(res.render).to.have.been.calledOnceWith('page/course/audience/configure-audience')
		})
	})

	describe('#deleteAudienceConfirmation', function() {
		it('should render delete audience confirmation page', async function() {
			await audienceController.deleteAudienceConfirmation()(req, res)

			expect(res.render).to.have.been.calledOnceWith('page/course/audience/delete-audience-confirmation')
		})
	})

	describe('#deleteAudience', function() {
		it('should redirect to course overview page after deleting the audience', async function() {
			const courseId = 'course-id'
			const audienceId = 'audience-id'
			req.params.courseId = courseId
			req.params.audienceId = audienceId

			learningCatalogue.deleteAudience = sinon.stub()

			await audienceController.deleteAudience()(req, res)

			expect(learningCatalogue.deleteAudience).to.have.been.calledOnceWith(courseId, audienceId)
			expect(res.redirect).to.have.been.calledOnceWith(`/content-management/courses/${courseId}/overview`)
		})
	})

	describe('#getOrganisation', function() {
		it('should render add-organisation page', async function() {
			csrsService.getOrganisations = sinon.stub()
			await audienceController.getOrganisation()(req, res)

			expect(res.render).to.have.been.calledOnceWith('page/course/audience/add-organisation')
		})
	})

	describe('#setOrganisation', function() {
		it('should update course audience with selected organisation code', async function() {
			const courseId = 'course-id'
			const audienceId = 'audience-id'
			req.params.courseId = courseId
			req.params.audienceId = audienceId

			const hmrcName = 'HM Revenue & Customs'
			req.body = {organisation: 'selected', 'input-autocomplete': hmrcName}

			const audience = {id: audienceId, departments: []}
			res.locals.course = {audiences: [audience]}

			const hmrcCode = 'hmrc'
			csrsService.getOrganisations = sinon
				.stub()
				.returns({_embedded: {organisations: [{code: hmrcCode, name: hmrcName}]}})
			learningCatalogue.updateCourse = sinon.stub()

			await audienceController.setOrganisation()(req, res)

			expect(learningCatalogue.updateCourse).to.have.been.calledOnceWith({
				audiences: [{id: audienceId, departments: [hmrcCode]}],
			})
			expect(res.redirect).to.have.been.calledOnceWith(
				`/content-management/courses/${courseId}/audiences/${audienceId}/configure`
			)
		})

		it('should update course audience with all organisation codes if "all" is selected', async function() {
			const courseId = 'course-id'
			const audienceId = 'audience-id'
			req.params.courseId = courseId
			req.params.audienceId = audienceId
			req.body = {organisation: 'all', 'input-autocomplete': ''}
			const audience = {id: audienceId, departments: []}
			res.locals.course = {audiences: [audience]}

			const hmrcCode = 'hmrc'
			const dwpCode = 'dwp'
			csrsService.getOrganisations = sinon.stub().returns({
				_embedded: {
					organisations: [
						{code: hmrcCode, name: 'HM Revenue & Customs'},
						{code: dwpCode, name: 'Department for Work and Pensions'},
					],
				},
			})
			learningCatalogue.updateCourse = sinon.stub()

			await audienceController.setOrganisation()(req, res)

			expect(learningCatalogue.updateCourse).to.have.been.calledOnceWith({
				audiences: [{id: audienceId, departments: [hmrcCode, dwpCode]}],
			})
			expect(res.redirect).to.have.been.calledOnceWith(
				`/content-management/courses/${courseId}/audiences/${audienceId}/configure`
			)
		})
	})
})
