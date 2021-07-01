/* tslint:disable:no-var-requires */
import * as config from './config'
import appInsights = require('applicationinsights')
appInsights.setup(config.APPLICATIONINSIGHTS_CONNECTION_STRING)
.setAutoCollectConsole(true)

appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = "lpg-management"
appInsights.start()


/* tslint:enable */

import { getLogger } from './utils/logger'
import * as express from 'express'
import * as session from 'express-session'
import * as cookieParser from 'cookie-parser'
import * as connectRedis from 'connect-redis'
import * as redis from 'redis'

import * as serveStatic from 'serve-static'
import {Properties} from 'ts-json-properties'
import {ApplicationContext} from './applicationContext'
import * as bodyParser from 'body-parser'
import {AppConfig} from './config/appConfig'
import moment = require('moment')
import {DateTime} from './lib/dateTime'
import * as asyncHandler from 'express-async-handler'
import * as errorController from './lib/errorHandler'
import {Duration} from 'moment'
import {OrganisationalUnit} from './csrs/model/organisationalUnit'

Properties.initialize()

const logger = getLogger('server')
const nunjucks = require('nunjucks')
const jsonpath = require('jsonpath')
const appRoot = require('app-root-path')
const {PORT = 3005} = process.env
const app = express()
const ctx = new ApplicationContext()
const i18n = require('i18n-express')
const fileUpload = require('express-fileupload')

app.use(
	i18n({
		translationsPath: appRoot + '/src/locale',
		siteLangs: ['en'],
		textsVarName: 'i18n',
	})
)

app.use(fileUpload())

nunjucks
	.configure([appRoot + '/views', appRoot + '/node_modules/govuk-frontend/govuk/', appRoot + '/node_modules/govuk-frontend/govuk/components'], {
		autoescape: true,
		express: app,
	})
	.addFilter('jsonpath', function(path: string | string[], map: any) {
		return Object.is(path, undefined) ? undefined : Array.isArray(path) ? path.map(pathElem => jsonpath.value(map, pathElem)) : jsonpath.value(map, path)
	})
	.addFilter('formatDate', function(date: Date) {
		return date
			? moment(date)
					.local()
					.format('D MMMM YYYY')
			: null
	})
	.addFilter('formatDateShort', function(date: Date) {
		return date
			? moment(date)
					.local()
					.format('D MMM YYYY')
			: null
	})
	.addFilter('dateWithMonthAsText', function(date: string) {
		return date ? DateTime.convertDate(date) : 'date unset'
	})
	.addFilter('formatDuration', function(duration: Duration) {
		let years = ''
		let months = ''
		if (duration.years()) {
			years = duration.years() + (duration.years() === 1 ? ' year ' : ' years ')
		}
		if (duration.months()) {
			months = duration.months() + (duration.months() === 1 ? ' month' : ' months')
		}

		return years + months
	})
	.addFilter('parseOrganisation', function(organisationalUnits: OrganisationalUnit[], code: string) {
		return organisationalUnits.find(o => o.code === code)
	})

app.set('view engine', 'html')

app.use('/assets', serveStatic(appRoot + '/node_modules/govuk-frontend/govuk/assets'))
app.use('/js', serveStatic(appRoot + '/views/assets/js'))
app.use(serveStatic(appRoot + '/dist/views/assets'))
app.use('/govuk-frontend', serveStatic(appRoot + '/node_modules/govuk-frontend/govuk/'))
app.use('/sortablejs', serveStatic(appRoot + '/node_modules/sortablejs/'))

const RedisStore = connectRedis(session)
const redisClient = redis.createClient({
	auth_pass: config.REDIS.password,
	host: config.REDIS.host,
	no_ready_check: true,
	port: config.REDIS.port,
})

app.use(cookieParser())

const appConfig = new AppConfig()
app.use(
	session({
		cookie: appConfig.cookie,
		name: appConfig.name,
		resave: appConfig.resave,
		saveUninitialized: appConfig.saveUninitialized,
		secret: appConfig.secret,
		store: new RedisStore({
			client: redisClient,
		}),
	})
)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

ctx.auth.configure(app)
app.use(ctx.addToResponseLocals())
app.use(ctx.courseController.router)
app.use(ctx.audienceController.router)
app.use(ctx.learningProviderController.router)
app.use(ctx.cancellationPolicyController.router)
app.use(ctx.termsAndConditionsController.router)
app.use(ctx.moduleController.router)
app.use(ctx.fileController.router)
app.use(ctx.youtubeModuleController.router)
app.use(ctx.linkModuleController.router)
app.use(ctx.faceToFaceController.router)
app.use(ctx.eventController.router)
app.use(ctx.organisationController.router)
app.use(ctx.searchController.router)
app.use(ctx.reportingController.router)
app.use(ctx.skillsController.router)
app.use(ctx.agencyTokenController.router)

app.get('/', function(req: any, res: any) {
	res.redirect('/content-management')
})

app.get('/log-out', asyncHandler(ctx.auth.logout()))

app.get('/content-management', asyncHandler(ctx.homeController.index()))

app.use(errorController.handleError)

const server = app.listen(PORT, () => logger.info(`LPG Management listening on port ${PORT}`))
server.setTimeout(config.SERVER_TIMEOUT_MS)
