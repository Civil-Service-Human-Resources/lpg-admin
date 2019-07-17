import {beforeEach, describe, it} from 'mocha'
import {mockReq, mockRes} from 'sinon-express-mock'
import * as chai from 'chai'
import {expect} from 'chai'
import * as sinonChai from 'sinon-chai'
import {NextFunction, Request, Response} from 'express'
import * as sinon from 'sinon'
import {OrganisationController} from '../../../src/controllers/organisationController'
import {Csrs} from '../../../src/csrs/index'
import {OrganisationalUnit} from '../../../src/csrs/model/organisationalUnit'
import {PageResults} from '../../../src/learning-catalogue/model/pageResults'
import {OrganisationalUnitFactory} from '../../../src/csrs/model/organisationalUnitFactory'
import {Validator} from '../../../src/learning-catalogue/validator/validator'
import {OrganisationalUnitService} from '../../../src/csrs/service/organisationalUnitService'

chai.use(sinonChai)

describe('Organisation Controller Tests', function() {
	let organisationController: OrganisationController
	let csrs: Csrs
	let organisationalUnitFactory: OrganisationalUnitFactory
	let validator: Validator<OrganisationalUnit>
	let organisationalService: OrganisationalUnitService

	let req: Request
	let res: Response
	let next: NextFunction

	beforeEach(() => {
		csrs = <Csrs>{}
		organisationalUnitFactory = <OrganisationalUnitFactory>{}
		validator = <Validator<OrganisationalUnit>>{}
		organisationalService = <OrganisationalUnitService>{}
		organisationController = new OrganisationController(csrs, organisationalUnitFactory, validator, organisationalService)

		req = mockReq()
		res = mockRes()
		next = sinon.stub()

		req.session!.save = callback => {
			callback(undefined)
		}
	})

	it('should call manage organisations page with organisations list', async function() {
		const organisationalUnit: OrganisationalUnit = new OrganisationalUnit()

		const pageResults: PageResults<OrganisationalUnit> = {
			page: 0,
			size: 10,
			totalResults: 10,
			results: [organisationalUnit],
		} as PageResults<OrganisationalUnit>

		const getOrganisations: (request: Request, response: Response, next: NextFunction) => void = organisationController.getOrganisationList()

		let listOrganisationalUnits = sinon.stub().returns(Promise.resolve(pageResults))
		csrs.listOrganisationalUnits = listOrganisationalUnits

		await getOrganisations(req, res, next)

		expect(res.render).to.have.been.calledOnceWith('page/organisation/manage-organisations', {organisationalUnits: pageResults})
	})

	it('should call organisation overview page with organisation', async function() {
		const organisationalUnit: OrganisationalUnit = new OrganisationalUnit()
		organisationalUnit.id == ''

		const getOrganisation: (request: Request, response: Response) => void = organisationController.organisationOverview()

		let getOrganisationalUnit = sinon.stub().returns(Promise.resolve(organisationalUnit))
		organisationalService.getOrganisationalUnit = getOrganisationalUnit

		await getOrganisation(req, res)

		expect(res.render).to.have.been.calledOnceWith('page/organisation/organisation-overview')
	})

	it('should call organisation page with organisations typeahead list', async function() {
		const organisationalUnit: OrganisationalUnit = new OrganisationalUnit()

		const pageResults: PageResults<OrganisationalUnit> = {
			page: 0,
			size: 10,
			totalResults: 10,
			results: [organisationalUnit],
		} as PageResults<OrganisationalUnit>

		const addOrganisation: (request: Request, response: Response) => void = organisationController.addEditOrganisation()

		let listOrganisationalUnitsForTypehead = sinon.stub().returns(Promise.resolve(pageResults))
		csrs.listOrganisationalUnitsForTypehead = listOrganisationalUnitsForTypehead

		await addOrganisation(req, res)

		expect(res.render).to.have.been.calledOnceWith('page/organisation/add-edit-organisation')
	})

	it('should check for organisation errors and redirect to manage organisation page if no errors', async function() {
		const errors = {fields: [], size: 0}
		const organisation = new OrganisationalUnit()
		organisation.id = 'id-123'
		organisation.name = 'New organisation'

		organisationalUnitFactory.create = sinon.stub().returns(organisation)
		validator.check = sinon.stub().returns({fields: [], size: 0})
		csrs.createOrganisationalUnit = sinon.stub().returns(organisation)

		const createOrganisation = organisationController.createOrganisation()
		await createOrganisation(req, res)

		expect(validator.check).to.have.been.calledWith(req.body, ['all'])
		expect(validator.check).to.have.returned(errors)
		expect(res.redirect).to.have.been.calledWith(`/content-management/organisations/${organisation.id}/overview`)
	})

	it('should check for organisation errors and redirect to add organisation page if errors', async function() {
		const errors = {
			fields: ['validation.organisations.name.empty'],
			size: 1,
		}
		const organisation = new OrganisationalUnit()
		organisation.name = 'New organisation'

		organisationalUnitFactory.create = sinon.stub().returns(organisation)
		validator.check = sinon.stub().returns(errors)
		csrs.createOrganisationalUnit = sinon.stub().returns('123')

		const createOrganisation = organisationController.createOrganisation()
		await createOrganisation(req, res)

		expect(validator.check).to.have.been.calledWith(req.body, ['all'])
		expect(validator.check).to.have.returned(errors)
		expect(res.redirect).to.have.been.calledWith('/content-management/organisations')
	})

	it('should check for organisation errors and redirect to add organisation page if error caught', async function() {
		const validationErrors = {fields: [], size: 0}
		const errors = {fields: {fields: ['organisations.validation.organisation.alreadyExists'], size: 1}}

		const organisation = new OrganisationalUnit()
		organisation.name = 'New organisation'

		organisationalUnitFactory.create = sinon.stub().returns(organisation)
		csrs.createOrganisationalUnit = sinon.stub().throwsException(new Error())
		validator.check = sinon.stub().returns(validationErrors)

		const createOrganisation = organisationController.createOrganisation()
		await createOrganisation(req, res)

		expect(req.session!.sessionFlash).to.eql({errors: errors})
		expect(res.redirect).to.have.been.calledWith('/content-management/organisations')
	})

	//
	it('should check for organisation errors when updating and redirect to manage organisation page if no errors', async function() {
		const errors = {fields: [], size: 0}
		const organisation = new OrganisationalUnit()
		organisation.id = 'id-123'
		organisation.name = 'New organisation'

		res.locals.organisationalUnit = organisation

		organisationalUnitFactory.create = sinon.stub().returns(organisation)
		validator.check = sinon.stub().returns({fields: [], size: 0})
		csrs.updateOrganisationalUnit = sinon.stub().returns(organisation)

		const updateOrganisation = organisationController.updateOrganisation()
		await updateOrganisation(req, res)

		expect(validator.check).to.have.been.calledWith(req.body, ['all'])
		expect(validator.check).to.have.returned(errors)
		expect(res.redirect).to.have.been.calledWith(`/content-management/organisations/${organisation.id}/overview`)
	})

	it('should check for organisation errors when updating and redirect to organisation page if errors', async function() {
		const errors = {
			fields: ['validation.organisations.name.empty'],
			size: 1,
		}
		const organisation = new OrganisationalUnit()
		organisation.name = 'New organisation'
		organisation.id = 'id-123'
		req.params.organisationId = organisation.id

		organisationalUnitFactory.create = sinon.stub().returns(organisation)
		validator.check = sinon.stub().returns(errors)
		csrs.updateOrganisationalUnit = sinon.stub().returns('123')

		const updateOrganisation = organisationController.updateOrganisation()
		await updateOrganisation(req, res)

		expect(validator.check).to.have.been.calledWith(req.body, ['all'])
		expect(validator.check).to.have.returned(errors)
		expect(res.redirect).to.have.been.calledWith(`/content-management/organisations/:organisationalUnitId`)
	})

	it('should check for organisation errors when updating and redirect to add organisation page if error caught', async function() {
		const validationErrors = {fields: [], size: 0}
		const errors = {fields: {fields: ['organisations.validation.organisation.alreadyExists'], size: 1}}

		const organisation = new OrganisationalUnit()
		organisation.name = 'New organisation'
		organisation.id = 'id-123'
		res.locals.organisationalUnit = organisation
		req.params.organisationId = organisation.id

		organisationalUnitFactory.create = sinon.stub().returns(organisation)
		csrs.updateOrganisationalUnit = sinon.stub().throwsException(new Error())
		validator.check = sinon.stub().returns(validationErrors)

		const updateOrganisation = organisationController.updateOrganisation()
		await updateOrganisation(req, res)

		expect(req.session!.sessionFlash).to.eql({errors: errors})
		expect(res.redirect).to.have.been.calledWith(`/content-management/organisations/${organisation.id}`)
	})

	it('should check for render confirm delete page', async function() {
		const confirmDelete: (request: Request, response: Response) => void = organisationController.confirmDelete()

		const organisationalUnit: OrganisationalUnit = new OrganisationalUnit()
		organisationalUnit.id = '1'
		res.locals.organisationalUnit = organisationalUnit

		await confirmDelete(req, res)

		expect(res.render).to.have.been.calledOnceWith('page/organisation/delete-organisation')
	})

	it('should call delete organisation on csrs and redirect to organisations page', async function() {
		const deleteOrganisation: (request: Request, response: Response) => void = organisationController.deleteOrganisation()

		const organisationalUnit: OrganisationalUnit = new OrganisationalUnit()
		organisationalUnit.id = '1'
		res.locals.organisationalUnit = organisationalUnit

		csrs.deleteOrganisationalUnit = sinon.stub()

		await deleteOrganisation(req, res)

		expect(csrs.deleteOrganisationalUnit).to.have.been.calledOnceWith(organisationalUnit.id)
		expect(res.redirect).to.have.been.calledOnceWith('/content-management/organisations/manage')
	})
})
