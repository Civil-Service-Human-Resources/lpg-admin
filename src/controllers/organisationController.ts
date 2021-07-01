import {NextFunction, Request, Response, Router} from 'express'
import {OrganisationalUnit} from '../csrs/model/organisationalUnit'
import {Csrs} from '../csrs/index'
import {DefaultPageResults} from '../learning-catalogue/model/defaultPageResults'
import * as asyncHandler from 'express-async-handler'
import {OrganisationalUnitFactory} from '../csrs/model/organisationalUnitFactory'
import {FormController} from './formController'
import {Validator} from '../learning-catalogue/validator/validator'
import {Validate} from './formValidator'
import {OrganisationalUnitService} from '../csrs/service/organisationalUnitService'
import { getLogger } from '../utils/logger'

export class OrganisationController implements FormController {
	logger = getLogger('OrganisationController')
	router: Router
	csrs: Csrs
	organisationalUnitFactory: OrganisationalUnitFactory
	validator: Validator<OrganisationalUnit>
	organisationalUnitService: OrganisationalUnitService

	constructor(csrs: Csrs, organisationalUnitFactory: OrganisationalUnitFactory, validator: Validator<OrganisationalUnit>, organisationalUnitService: OrganisationalUnitService) {
		this.router = Router()
		this.csrs = csrs
		this.organisationalUnitFactory = organisationalUnitFactory
		this.validator = validator
		this.organisationalUnitService = organisationalUnitService

		this.getOrganisationFromRouterParamAndSetOnLocals()

		this.setRouterPaths()
	}

	/* istanbul ignore next */
	// prettier-ignore
	private getOrganisationFromRouterParamAndSetOnLocals() {
		this.router.param('organisationalUnitId', asyncHandler(async (req: Request, res: Response, next: NextFunction, organisationalUnitId: string) => {
				const organisationalUnit: OrganisationalUnit = await this.organisationalUnitService.getOrganisationalUnit(organisationalUnitId)

				if (organisationalUnit) {
					res.locals.organisationalUnit = organisationalUnit
					next()
				} else {
					res.sendStatus(404)
				}
			})
		)
	}

	/* istanbul ignore next */
	private setRouterPaths() {
		this.router.get('/content-management/organisations/manage', asyncHandler(this.getOrganisationList()))
		this.router.get('/content-management/organisations/:organisationalUnitId?', asyncHandler(this.addEditOrganisation()))
		this.router.get('/content-management/organisations/:organisationalUnitId/overview', asyncHandler(this.organisationOverview()))
		this.router.post('/content-management/organisations/', asyncHandler(this.createOrganisation()))
		this.router.post('/content-management/organisations/:organisationalUnitId', asyncHandler(this.updateOrganisation()))
		this.router.get('/content-management/organisations/:organisationalUnitId/confirm-delete', asyncHandler(this.confirmDelete()))
		this.router.post('/content-management/organisations/:organisationalUnitId/delete', asyncHandler(this.deleteOrganisation()))
	}

	public getOrganisationList() {
		return async (request: Request, response: Response, next: NextFunction) => {
			await this.csrs
				.listOrganisationalUnits()
				.then(organisationalUnits => {
					response.render('page/organisation/manage-organisations', {organisationalUnits: organisationalUnits})
				})
				.catch(error => {
					next(error)
				})
		}
	}

	public organisationOverview() {
		return async (request: Request, response: Response) => {
			this.deleteAgencyTokenDataStoredInSession(request)

			response.render('page/organisation/organisation-overview')
		}
	}

	public addEditOrganisation() {
		return async (request: Request, response: Response) => {
			const organisationalUnits: DefaultPageResults<OrganisationalUnit> = await this.csrs.listOrganisationalUnitsForTypehead()

			response.render('page/organisation/add-edit-organisation', {organisationalUnits: organisationalUnits})
		}
	}

	@Validate({
		fields: ['all'],
		redirect: '/content-management/organisations',
	})
	public createOrganisation() {
		return async (request: Request, response: Response) => {
			const organisationalUnit = this.organisationalUnitFactory.create(request.body)

			this.logger.debug(`Creating new organisation: ${organisationalUnit.name}`)

			try {
				const newOrganisationalUnit: OrganisationalUnit = await this.csrs.createOrganisationalUnit(organisationalUnit)
				request.session!.sessionFlash = {organisationAddedSuccessMessage: 'organisationAddedSuccessMessage'}
				this.csrs.listOrganisationalUnits()
				this.csrs.listOrganisationalUnitsForTypehead()
				response.redirect(`/content-management/organisations/${newOrganisationalUnit.id}/overview`)
			} catch (e) {
				const errors = {fields: {fields: ['organisations.validation.organisation.alreadyExists'], size: 1}}

				request.session!.sessionFlash = {errors: errors}

				return request.session!.save(() => {
					response.redirect(`/content-management/organisations`)
				})
			}
		}
	}

	@Validate({
		fields: ['all'],
		redirect: '/content-management/organisations/:organisationalUnitId',
	})
	public updateOrganisation() {
		return async (request: Request, response: Response) => {
			let organisationalUnit = response.locals.organisationalUnit

			this.logger.debug(`Updating organisation: ${organisationalUnit.id}`)

			const data = {
				name: request.body.name || organisationalUnit.name,
				abbreviation: request.body.abbreviation || organisationalUnit.abbreviation,
				code: request.body.code || organisationalUnit.code,
				parent: request.body.parent,
				agencyToken: organisationalUnit.agencyToken,
			}

			try {
				await this.csrs.updateOrganisationalUnit(organisationalUnit.id, data)
				this.csrs.listOrganisationalUnits()
				this.csrs.listOrganisationalUnitsForTypehead()
			} catch (e) {
				const errors = {fields: {fields: ['organisations.validation.organisation.alreadyExists'], size: 1}}

				request.session!.sessionFlash = {errors: errors}

				return request.session!.save(() => {
					response.redirect(`/content-management/organisations/${organisationalUnit.id}`)
				})
			}

			response.redirect(`/content-management/organisations/${organisationalUnit.id}/overview`)
		}
	}

	public confirmDelete() {
		return async (request: Request, response: Response) => {
			response.render('page/organisation/delete-organisation')
		}
	}

	public deleteOrganisation() {
		return async (request: Request, response: Response) => {
			const organisationalUnit = response.locals.organisationalUnit

			await this.csrs.deleteOrganisationalUnit(organisationalUnit.id)

			request.session!.sessionFlash = {organisationRemovedMessage: 'organisationRemovedMessage', organisationalUnit: organisationalUnit}

			response.redirect('/content-management/organisations/manage')
		}
	}

	private deleteAgencyTokenDataStoredInSession(request: any) {
		if (request.session!.domainsForAgencyToken) {
			delete request.session!.domainsForAgencyToken
		}
		if (request.session!.agencyTokenNumber) {
			delete request.session!.agencyTokenNumber
		}
	}
}
