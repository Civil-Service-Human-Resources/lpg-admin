import {Request, Response, Router} from 'express'
import {LearningCatalogue} from '../../learning-catalogue'
import {CancellationPolicyFactory} from '../../learning-catalogue/model/factory/cancellationPolicyFactory'
import {Validator} from '../../learning-catalogue/validator/validator'
import {CancellationPolicy} from '../../learning-catalogue/model/cancellationPolicy'
import { getLogger } from '../../utils/logger'

export class CancellationPolicyController {
	logger = getLogger('CancellationPolicyController')
	learningCatalogue: LearningCatalogue
	cancellationPolicyValidator: Validator<CancellationPolicy>
	cancellationPolicyFactory: CancellationPolicyFactory
	router: Router

	constructor(
		learningCatalogue: LearningCatalogue,
		cancellationPolicyFactory: CancellationPolicyFactory,
		cancellationPolicyValidator: Validator<CancellationPolicy>
	) {
		this.learningCatalogue = learningCatalogue
		this.cancellationPolicyValidator = cancellationPolicyValidator
		this.cancellationPolicyFactory = cancellationPolicyFactory

		this.router = Router()

		this.setRouterPaths()
	}

	/* istanbul ignore next */
	private setRouterPaths() {
		this.router.param('cancellationPolicyId', async (req, res, next, cancellationPolicyId) => {
			const learningProviderId = req.params.learningProviderId

			const cancellationPolicy = await this.learningCatalogue.getCancellationPolicy(
				learningProviderId,
				cancellationPolicyId
			)

			if (cancellationPolicy) {
				res.locals.cancellationPolicy = cancellationPolicy
				next()
			} else {
				res.sendStatus(404)
			}
		})

		this.router.param('learningProviderId', async (req, res, next, learningProviderId) => {
			const learningProvider = await this.learningCatalogue.getLearningProvider(learningProviderId)

			if (learningProvider) {
				res.locals.learningProvider = learningProvider
				next()
			} else {
				res.sendStatus(404)
			}
		})

		this.router.get(
			'/content-management/learning-providers/:learningProviderId/cancellation-policies/:cancellationPolicyId?',
			this.getCancellationPolicy()
		)

		this.router.post(
			'/content-management/learning-providers/:learningProviderId/cancellation-policies/:cancellationPolicyId?',
			this.setCancellationPolicy()
		)

		this.router.get(
			'/content-management/learning-providers/:learningProviderId/cancellation-policies/:cancellationPolicyId/delete',
			this.deleteCancellationPolicy()
		)
	}

	public getCancellationPolicy() {
		this.logger.debug('Getting cancellation policy')
		return async (request: Request, response: Response) => {
			response.render('page/learning-provider/cancellation-policy')
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
				return response.render('page/learning-provider/cancellation-policy', {
					errors: errors,
					cancellationPolicy: cancellationPolicy,
				})
			}

			if (request.params.cancellationPolicyId) {
				await this.editCancellationPolicy(request, response)

				return response.redirect(`/content-management/learning-providers/${learningProviderId}`)
			}

			await this.learningCatalogue.createCancellationPolicy(learningProviderId, cancellationPolicy)

			response.redirect(`/content-management/learning-providers/${learningProviderId}`)
		}
	}

	public deleteCancellationPolicy() {
		return async (request: Request, response: Response) => {
			const learningProviderId: string = request.params.learningProviderId
			const cancellationPolicyId: string = request.params.cancellationPolicyId

			await this.learningCatalogue.deleteCancellationPolicy(learningProviderId, cancellationPolicyId)

			response.redirect(`/content-management/learning-providers/${learningProviderId}`)
		}
	}

	private async editCancellationPolicy(request: Request, response: Response) {
		const data = {
			...request.body,
			id: response.locals.cancellationPolicy.id,
			name: request.body.name || response.locals.cancellationPolicy.title,
			fullVersion: request.body.fullVersion || response.locals.cancellationPolicy.fullVersion,
			shortVersion: request.body.shortVersion || response.locals.cancellationPolicy.shortVersion,
		}

		const cancellationPolicy = this.cancellationPolicyFactory.create(data)

		await this.learningCatalogue.updateCancellationPolicy(request.params.learningProviderId, cancellationPolicy)
	}
}
