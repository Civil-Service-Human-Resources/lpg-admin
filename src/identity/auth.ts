import {NextFunction, Request, Response, Handler} from 'express'
import * as config from '../config'
import * as log4js from 'log4js'
import {PassportStatic} from 'passport'
import {IdentityService} from './identityService'
import * as oauth2 from 'passport-oauth2'
import {Identity} from './identity'

const logger = log4js.getLogger('config/passport')

export class Auth {
	readonly REDIRECT_COOKIE_NAME: string = 'redirectTo'

	clientId: string
	clientSecret: string
	authenticationServiceUrl: string
	callbackUrl: string
	passportStatic: PassportStatic
	identityService: IdentityService

	constructor(
		clientId: string,
		clientSecret: string,
		authenticationServiceUrl: string,
		callbackUrl: string,
		passportStatic: PassportStatic,
		identityService: IdentityService
	) {
		this.clientId = clientId
		this.clientSecret = clientSecret
		this.authenticationServiceUrl = authenticationServiceUrl
		this.callbackUrl = callbackUrl
		this.passportStatic = passportStatic
		this.identityService = identityService
	}

	initialize(): Handler {
		return this.passportStatic.initialize()
	}

	session(): Handler {
		return this.passportStatic.session()
	}

	configureStrategy() {
		let strategy: oauth2.Strategy
		strategy = new oauth2.Strategy(
			{
				authorizationURL: `${this.authenticationServiceUrl}/oauth/authorize`,
				callbackURL: `${this.callbackUrl}/authenticate`,
				clientID: this.clientId,
				clientSecret: this.clientSecret,
				tokenURL: `${this.authenticationServiceUrl}/oauth/token`,
			},
			this.verify()
		)
		this.passportStatic.use(strategy)

		this.passportStatic.serializeUser((user, done) => {
			done(null, JSON.stringify(user))
		})

		this.passportStatic.deserializeUser<Identity, string>(
			this.deserializeUser()
		)
	}

	verify() {
		return async (
			accessToken: string,
			refreshToken: string,
			profile: any,
			cb: oauth2.VerifyCallback
		) => {
			try {
				const identityDetails = await this.identityService.getDetails(
					accessToken
				)

				cb(null, identityDetails)
			} catch (e) {
				logger.warn(`Error retrieving user profile information`, e)
				cb(e)
			}
		}
	}

	checkAuthenticated() {
		return (req: Request, res: Response, next: NextFunction) => {
			if (req.isAuthenticated()) {
				return next()
			}

			res.cookie(this.REDIRECT_COOKIE_NAME, req.originalUrl)
			res.redirect(config.AUTHENTICATION_PATH)
		}
	}

	authenticate() {
		return this.passportStatic.authenticate('oauth2', {
			failureFlash: true,
			failureRedirect: '/',
		})
	}

	redirect() {
		return (req: Request, res: Response) => {
			const redirect = req.cookies[this.REDIRECT_COOKIE_NAME]
			if (!redirect) {
				logger.info(
					'Passport session not present on express request - redirecting to root'
				)
				res.redirect('/')
				return
			}
			delete req.cookies[this.REDIRECT_COOKIE_NAME]
			res.redirect(redirect)
		}
	}

	deserializeUser() {
		return async (data: string, done: any) => {
			let jsonResponse = JSON.parse(data)
			done(
				null,
				new Identity(
					jsonResponse.uid,
					jsonResponse.roles,
					jsonResponse.accessToken
				)
			)
		}
	}
}
