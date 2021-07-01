import {NextFunction, Request, Response, Router} from 'express'
import * as asyncHandler from 'express-async-handler'
import {AgencyToken} from '../csrs/model/agencyToken'
import {AgencyTokenService} from '../lib/agencyTokenService'
import {FormController} from './formController'
import {OrganisationalUnit} from '../csrs/model/organisationalUnit'
import {OrganisationalUnitService} from '../csrs/service/organisationalUnitService'
import {Validator} from '../learning-catalogue/validator/validator'
import {Validate} from './formValidator'
import {AgencyTokenFactory} from '../csrs/model/agencyTokenFactory'
import {Csrs} from '../csrs'
import { getLogger } from '../utils/logger'

export class AgencyTokenController implements FormController {
	logger = getLogger('AgencyTokenController')
	router: Router
	validator: Validator<AgencyToken>
	agencyTokenService: AgencyTokenService
	organisationalUnitService: OrganisationalUnitService
	agencyTokenFactory: AgencyTokenFactory
	csrs: Csrs

	constructor(
		validator: Validator<AgencyToken>,
		agencyTokenService: AgencyTokenService,
		organisationalUnitService: OrganisationalUnitService,
		agencyTokenFactory: AgencyTokenFactory,
		csrs: Csrs
	) {
		this.router = Router()
		this.validator = validator
		this.agencyTokenService = agencyTokenService
		this.organisationalUnitService = organisationalUnitService
		this.agencyTokenFactory = agencyTokenFactory
		this.csrs = csrs

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
		this.router.get('/content-management/organisations/:organisationalUnitId/agency-token', asyncHandler(this.addEditAgencyToken()))
		this.router.post('/content-management/organisations/:organisationalUnitId/agency-token', asyncHandler(this.createAgencyToken()))
		this.router.post('/content-management/organisations/:organisationalUnitId/agency-token/edit', asyncHandler(this.updateAgencyToken()))
		this.router.get('/content-management/organisations/:organisationalUnitId/agency-token/delete', asyncHandler(this.deleteAgencyTokenConfirmation()))
		this.router.post('/content-management/organisations/:organisationalUnitId/agency-token/delete', asyncHandler(this.deleteAgencyToken()))
		this.router.post('/content-management/organisations/:organisationalUnitId/agency-token/domain', asyncHandler(this.addDomainToAgencyTokenWithinSession()))
		this.router.post('/content-management/organisations/:organisationalUnitId/agency-token/domain/delete', asyncHandler(this.deleteDomainFromAgencyTokenWithinSession()))
	}

	public addEditAgencyToken() {
		return async (request: Request, response: Response) => {
			const organisationalUnit: OrganisationalUnit = response.locals.organisationalUnit

			if (!request.session!.agencyTokenNumber) {
				if (organisationalUnit.agencyToken) {
					request.session!.agencyTokenNumber = organisationalUnit.agencyToken.token
				} else {
					request.session!.agencyTokenNumber = this.agencyTokenService.generateToken()
				}
			}
			const agencyTokenNumber = request.session!.agencyTokenNumber

			if (organisationalUnit.agencyToken && !request.session!.domainsForAgencyToken) {
				request.session!.domainsForAgencyToken = organisationalUnit.agencyToken.agencyDomains.map(agencyDomain => {
					return agencyDomain.domain
				})
			}

			const domainsForAgencyToken = request.session!.domainsForAgencyToken

			request.session!.save(() => {
				response.render('page/organisation/add-edit-agency-token', {
					organisationalUnit: organisationalUnit,
					agencyTokenNumber: agencyTokenNumber,
					domainsForAgencyToken: domainsForAgencyToken,
				})
			})
		}
	}

	public redirectToAddEditAgencyTokenWithError(request: Request, response: Response, error: any) {
		const organisationalUnit: OrganisationalUnit = response.locals.organisationalUnit
		request.session!.sessionFlash = {errors: error}

		return request.session!.save(() => {
			response.redirect(`/content-management/organisations/${organisationalUnit.id}/agency-token`)
		})
	}

	@Validate({
		fields: ['all'],
		redirect: '/content-management/organisations/:organisationalUnitId/agency-token',
	})
	public createAgencyToken() {
		return async (request: Request, response: Response, next: NextFunction) => {
			const organisationalUnit: OrganisationalUnit = response.locals.organisationalUnit

			this.logger.debug(`Adding agency token to organisation: ${organisationalUnit.name}`)

			const capacityIsValid = this.agencyTokenService.validateCapacity(request.body.capacity)
			if (!capacityIsValid) {
				const error = {fields: {capacity: ['agencyToken.validation.capacity.invalid']}, size: 1}
				return this.redirectToAddEditAgencyTokenWithError(request, response, error)
			}

			const domainsIsValid = this.agencyTokenService.validateDomains(request.session!.domainsForAgencyToken)
			if (!domainsIsValid) {
				let errorText = ''
				if (!(Array.isArray(request.session!.domainsForAgencyToken) && request.session!.domainsForAgencyToken.length)) {
					errorText = 'agencyToken.validation.domains.empty'
				} else {
					errorText = 'agencyToken.validation.domains.invalid'
				}
				const error = {fields: {domains: [errorText]}, size: 1}
				return this.redirectToAddEditAgencyTokenWithError(request, response, error)
			}

			const agencyTokenNumberFormatIsValid = this.agencyTokenService.validateAgencyTokenNumber(request.body.tokenNumber)
			if (!agencyTokenNumberFormatIsValid) {
				const error = {fields: {tokenNumber: ['agencyToken.validation.tokenNumber.invalidFormat']}, size: 1}
				return this.redirectToAddEditAgencyTokenWithError(request, response, error)
			}

			const data = {
				...request.body,
				domains: request.session!.domainsForAgencyToken,
			}
			const agencyToken: AgencyToken = this.agencyTokenFactory.create(data)

			await this.csrs
				.createAgencyToken(organisationalUnit.id, agencyToken)
				.then(() => {
					this.deleteAgencyTokenDataStoredInSession(request)
					response.redirect(`/content-management/organisations/${organisationalUnit.id}/overview`)
				})
				.catch(rejected => {
					if (rejected.response.status == 400) {
						const error = {fields: {capacity: rejected.response.data.capacity}, size: 1}
						return this.redirectToAddEditAgencyTokenWithError(request, response, error)
					} else {
						next(rejected)
					}
				})
		}
	}

	@Validate({
		fields: ['all'],
		redirect: '/content-management/organisations/:organisationalUnitId/agency-token',
	})
	public updateAgencyToken() {
		return async (request: Request, response: Response, next: NextFunction) => {
			const organisationalUnit: OrganisationalUnit = response.locals.organisationalUnit

			this.logger.debug(`Updating agency token for organisation: ${organisationalUnit.name}`)

			const capacityIsValid = this.agencyTokenService.validateCapacity(request.body.capacity)
			if (!capacityIsValid) {
				const error = {fields: {capacity: ['agencyToken.validation.capacity.invalid']}, size: 1}
				return this.redirectToAddEditAgencyTokenWithError(request, response, error)
			}

			if (request.body.capacity < organisationalUnit.agencyToken.capacityUsed) {
				const error = {fields: {capacity: ['agencyToken.validation.capacity.lessThanCurrentUsage']}, size: 1}
				return this.redirectToAddEditAgencyTokenWithError(request, response, error)
			}

			const domainsIsValid = this.agencyTokenService.validateDomains(request.session!.domainsForAgencyToken)
			if (!domainsIsValid) {
				let errorText = ''
				if (!(Array.isArray(request.session!.domainsForAgencyToken) && request.session!.domainsForAgencyToken.length)) {
					errorText = 'agencyToken.validation.domains.empty'
				} else {
					errorText = 'agencyToken.validation.domains.invalid'
				}
				const error = {fields: {domains: [errorText]}, size: 1}
				return this.redirectToAddEditAgencyTokenWithError(request, response, error)
			}

			const agencyTokenNumberFormatIsValid = this.agencyTokenService.validateAgencyTokenNumber(request.body.tokenNumber)
			if (!agencyTokenNumberFormatIsValid) {
				const error = {fields: {tokenNumber: ['agencyToken.validation.tokenNumber.invalidFormat']}, size: 1}
				return this.redirectToAddEditAgencyTokenWithError(request, response, error)
			}

			const data = {
				...request.body,
				domains: request.session!.domainsForAgencyToken,
			}
			const agencyToken: AgencyToken = this.agencyTokenFactory.create(data)

			await this.csrs
				.updateAgencyToken(organisationalUnit.id, agencyToken)
				.then(() => {
					this.deleteAgencyTokenDataStoredInSession(request)
					response.redirect(`/content-management/organisations/${organisationalUnit.id}/overview`)
				})
				.catch(rejected => {
					if (rejected.response.status == 400) {
						const error = {fields: {capacity: rejected.response.data.capacity}, size: 1}
						return this.redirectToAddEditAgencyTokenWithError(request, response, error)
					} else {
						next(rejected)
					}
				})
		}
	}

	public deleteAgencyTokenConfirmation() {
		return async (request: Request, response: Response) => {
			response.render('page/organisation/delete-agency-token')
		}
	}

	public deleteAgencyToken() {
		return async (request: Request, response: Response, next: NextFunction) => {
			const organisationalUnit = response.locals.organisationalUnit

			this.logger.debug(`Deleting agency token from organisation: ${organisationalUnit.name}`)

			await this.csrs
				.deleteAgencyToken(organisationalUnit.id)
				.then(() => {
					request.session!.sessionFlash = {displayAgencyTokenRemovedMessage: true, organisationalUnit: organisationalUnit}
					return response.redirect(`/content-management/organisations/${organisationalUnit.id}/overview`)
				})
				.catch(error => {
					next(error)
				})
		}
	}

	public addDomainToAgencyTokenWithinSession() {
		return async (request: Request, response: Response) => {
			const organisationalUnit: OrganisationalUnit = response.locals.organisationalUnit
			const domainToAdd = request.body.domainToAdd

			const domainIsValid = this.agencyTokenService.validateDomains([domainToAdd])
			if (!domainIsValid) {
				const error = {fields: {domains: ['agencyToken.validation.domains.invalidFormat']}, size: 1}
				return this.redirectToAddEditAgencyTokenWithError(request, response, error)
			}

			if (request.session!.domainsForAgencyToken == undefined) {
				request.session!.domainsForAgencyToken = []
			}

			if (request.session!.domainsForAgencyToken.includes(domainToAdd)) {
				const error = {fields: {domains: ['agencyToken.validation.domains.alreadyExists']}, size: 1}
				return this.redirectToAddEditAgencyTokenWithError(request, response, error)
			}

			request.session!.domainsForAgencyToken.push(domainToAdd)

			request.session!.save(() => {
				response.redirect(`/content-management/organisations/${organisationalUnit.id}/agency-token`)
			})
		}
	}

	public deleteDomainFromAgencyTokenWithinSession() {
		return async (request: Request, response: Response) => {
			const organisationalUnit: OrganisationalUnit = response.locals.organisationalUnit
			const domainToDelete = request.body.domainToDelete

			request.session!.domainsForAgencyToken.forEach((domain: string, index: number) => {
				if (domain == domainToDelete) {
					request.session!.domainsForAgencyToken.splice(index, 1)
				}
			})

			request.session!.save(() => {
				response.redirect(`/content-management/organisations/${organisationalUnit.id}/agency-token`)
			})
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
