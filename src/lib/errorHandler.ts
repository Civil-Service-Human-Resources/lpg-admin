import {NextFunction, Request, Response} from 'express'
import { getLogger } from '../utils/logger'

const logger = getLogger('errorHandler')

export async function handleError(error: any, request: Request, response: Response, next: NextFunction) {
	try {
		logger.error('Error handling request for', request.method, request.url, request.body, '\n', error.stack)

		if (error.response && error.response.status == 401) {
			return response.redirect('/log-out')
		}

		if (error.response && error.response.status == 403) {
			const errors = {fields: {fields: ['errors.actionNotAuthorised'], size: 1}}
			request.session!.sessionFlash = {errors: errors}

			return request.session!.save(() => {
				response.redirect(`/content-management/`)
			})
		}

		response.status(500)

		response.render('page/error')
	} catch (e) {
		console.error('Error handling error', error, e)
		next(e)
	}
}
