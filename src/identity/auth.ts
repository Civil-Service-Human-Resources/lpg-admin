import {NextFunction, Request, Response, Handler} from 'express'
import {PassportStatic} from 'passport'
import {IdentityService} from './identityService'
import * as oauth2 from 'passport-oauth2'
import {Identity} from './identity'
import {AuthConfig} from './authConfig'
import {EnvValue} from 'ts-json-properties'
import { getLogger } from '../utils/logger'

export class Auth {
	readonly REDIRECT_COOKIE_NAME: string = 'redirectTo'
	readonly HTTP_UNAUTHORISED: number = 401

	logger = getLogger('Auth')
	config: AuthConfig
	passportStatic: PassportStatic
	identityService: IdentityService
	currentUser: Identity

	@EnvValue('LPG_UI_URL')
	public lpgUiUrl: String

	constructor(config: AuthConfig, passportStatic: PassportStatic, identityService: IdentityService) {
		this.config = config
		this.passportStatic = passportStatic
		this.identityService = identityService
	}

	configure(app: any) {
		app.use(this.initialize())
		app.use(this.session())

		this.configureStrategy()

		app.all(this.config.authenticationPath, this.authenticate(), this.redirect())

		app.use(this.checkAuthenticatedAndAssignCurrentUser())
		app.use(this.addToResponseLocals())
		app.use(this.hasAdminRole())
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
				authorizationURL: `${this.config.authenticationServiceUrl}/oauth/authorize`,
				callbackURL: `${this.config.callbackUrl}/authenticate`,
				clientID: this.config.clientId,
				clientSecret: this.config.clientSecret,
				tokenURL: `${this.config.authenticationServiceUrl}/oauth/token`,
			},
			this.verify()
		)
		this.passportStatic.use(strategy)

		this.passportStatic.serializeUser((user: any, done: any) => {
			done(null, JSON.stringify(user))
		})

		this.passportStatic.deserializeUser<Identity, string>(this.deserializeUser())
	}

	verify() {
		return async (accessToken: string, refreshToken: string, profile: any, cb: oauth2.VerifyCallback) => {
			try {
				const identityDetails = await this.identityService.getDetails(accessToken)

				cb(null, identityDetails)
			} catch (e) {
				this.logger.warn(`Error retrieving user profile information`, e)
				cb(e)
			}
		}
	}

	checkAuthenticatedAndAssignCurrentUser() {
		return (req: Request, res: Response, next: NextFunction) => {
			if (req.isAuthenticated()) {
				this.currentUser = req.user as Identity
				return next()
			}

			res.cookie(this.REDIRECT_COOKIE_NAME, req.originalUrl)
			res.redirect(this.config.authenticationPath)
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
				this.logger.info('Passport session not present on express request - redirecting to root')
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
			done(null, new Identity(jsonResponse.uid, jsonResponse.roles, jsonResponse.accessToken))
		}
	}

	addToResponseLocals() {
		return (req: Request, res: Response, next: NextFunction) => {
			res.locals.isAuthenticated = req.isAuthenticated()
			res.locals.identity = req.user
			next()
		}
	}

	hasAdminRole() {
		return (req: Request, res: Response, next: NextFunction) => {
			if (req.isAuthenticated()) {
				if (req.user && req.user.hasAnyAdminRole()) {
					return next()
				} else {
					if (req.user && req.user.uid) {
						this.logger.error('Rejecting non-admin user ' + req.user.uid + ' with IP '
							+ req.ip + ' from page ' + req.originalUrl)
					}
					try {
						this.identityService.logout(req!.user!.accessToken)
						req.logout()
						res.cookie(this.REDIRECT_COOKIE_NAME, this.lpgUiUrl)
						res.locals.lpgUiUrl = this.lpgUiUrl
						return res.redirect(this.lpgUiUrl.toString())
					} catch (e) {
						this.logger.warn(`Error logging user out`, e)
						res.cookie(this.REDIRECT_COOKIE_NAME, this.lpgUiUrl)
						res.locals.lpgUiUrl = this.lpgUiUrl
						return res.redirect(this.lpgUiUrl.toString())
					}
				}
			} else {
				res.cookie(this.REDIRECT_COOKIE_NAME, this.lpgUiUrl)
				res.locals.lpgUiUrl = this.lpgUiUrl
				return res.redirect(this.lpgUiUrl.toString())
			}
		}
	}

	logout() {
		return async (req: Request, res: Response) => {
			if (req.isAuthenticated()) {
				try {
					await this.identityService.logout(req!.user!.accessToken)
					req.logout()
					res.locals.lpgUiUrl = this.lpgUiUrl
					return res.redirect(this.lpgUiUrl.toString())
				} catch (e) {
					this.logger.warn(`Error logging user out`, e)
					res.cookie(this.REDIRECT_COOKIE_NAME, this.lpgUiUrl)
					res.locals.lpgUiUrl = this.lpgUiUrl
					return res.redirect(this.lpgUiUrl.toString())
				}
			} else {
				res.cookie(this.REDIRECT_COOKIE_NAME, this.lpgUiUrl)
				res.locals.lpgUiUrl = this.lpgUiUrl
				return res.redirect(this.lpgUiUrl.toString())
			}
		}
	}
}
