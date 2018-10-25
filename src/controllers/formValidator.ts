import {Request, Response} from 'express'
import {FormController} from './formController'

export function Validate(validationArgs: {fields: string[]; redirect: string}) {
	const substituteParams = (redirect: string, params: any) => {
		for (const param in params) {
			redirect = redirect.replace(`:${param}`, params[param])
		}

		return redirect
	}

	return (target: FormController, propertyKey: string, descriptor: any) => {
		const originalMethod = descriptor.value

		descriptor.value = function(...args: any[]) {
			const callback = originalMethod.apply(this, args)
			const validator = this.validator

			return async (request: Request, response: Response) => {
				const errors = await validator.check(request.body, validationArgs.fields)

				if (errors.size) {
					request.session!.sessionFlash = {
						errors,
						course: request.body,
					}

					return request.session!.save(() => {
						response.redirect(substituteParams(validationArgs.redirect, request.params))
					})
				} else {
					return await callback(request, response)
				}
			}
		}

		return descriptor
	}
}
