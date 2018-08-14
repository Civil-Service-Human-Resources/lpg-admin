import {Request, Response, Router} from 'express'
import * as log4js from 'log4js'
import {LearningCatalogue} from '../../learning-catalogue'
import {CancellationPolicyValidator} from '../../learning-catalogue/validator/cancellationPolicyValidator'
import {CancellationPolicyFactory} from '../../learning-catalogue/model/factory/cancellationPolicyFactory'
import {ContentRequest} from '../../extended'

const logger = log4js.getLogger('controllers/learningProviderController')

export class CancellationPolicyController {
	learningCatalogue: LearningCatalogue
	cancellationPolicyValidator: CancellationPolicyValidator
	cancellationPolicyFactory: CancellationPolicyFactory
	router: Router

	constructor(
		learningCatalogue: LearningCatalogue,
		cancellationPolicyValidator: CancellationPolicyValidator,
		cancellationPolicyFactory: CancellationPolicyFactory
	) {
		this.learningCatalogue = learningCatalogue
		this.cancellationPolicyValidator = cancellationPolicyValidator
		this.cancellationPolicyFactory = cancellationPolicyFactory

		this.router = Router()

		this.setRouterPaths()
	}

	private setRouterPaths() {
		this.router.param('cancellationPolicyId', async (ireq, res, next, cancellationPolicyId) => {
			const req = ireq as ContentRequest

			const learningProviderId = req.params.learningProviderId

			const cancellationPolicy = await this.learningCatalogue.getCancellationPolicy(
				learningProviderId,
				cancellationPolicyId
			)

			if (cancellationPolicy) {
				req.cancellationPolicy = cancellationPolicy
			} else {
				res.sendStatus(404)
			}
			next()
		})

		this.router.param('learningProviderId', async (ireq, res, next, learningProviderId) => {
			const req = ireq as ContentRequest

			const learningProvider = await this.learningCatalogue.getLearningProvider(learningProviderId)

			if (learningProvider) {
				req.learningProvider = learningProvider
			} else {
				res.sendStatus(404)
			}
			next()
		})

		this.router.get(
			'/content-management/learning-providers/:learningProviderId/add-cancellation-policy',
			this.getCancellationPolicy()
		)

		this.router.post(
			'/content-management/learning-providers/:learningProviderId/add-cancellation-policy',
			this.setCancellationPolicy()
		)
	}

	public getCancellationPolicy() {
		logger.debug('Getting cancellation policy')
		return async (request: Request, response: Response) => {
			const req = request as ContentRequest
			const learningProvider = req.learningProvider

			response.render('page/add-cancellation-policy', {learningProvider: learningProvider})
		}
	}

	public setCancellationPolicy() {
		return async (request: Request, response: Response) => {
			const learningProviderId: string = request.params.learningProviderId

			const data = {
				...request.body,
			}

			const cancellationPolicy = this.cancellationPolicyFactory.create(data)

			const errors = await this.cancellationPolicyValidator.check(request.body, ['name'])
			if (errors.size) {
				request.session!.sessionFlash = {errors: errors}
				return response.redirect(
					'/content-management/learning-providers/' + learningProviderId + '/add-cancellation-policy'
				)
			}

			await this.learningCatalogue.createCancellationPolicy(learningProviderId, cancellationPolicy)

			response.redirect('/content-management/learning-providers/' + learningProviderId)
		}
	}
}
