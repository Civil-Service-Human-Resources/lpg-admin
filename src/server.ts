import * as express from 'express'
import * as session from 'express-session'
import * as cookieParser from 'cookie-parser'
import * as sessionFileStore from 'session-file-store'
import * as log4js from 'log4js'
import * as config from './config'
import * as serveStatic from 'serve-static'
import {Properties} from 'ts-json-properties'
import {ApplicationContext} from './applicationContext'
import * as bodyParser from 'body-parser'
import {AppConfig} from './config/appConfig'
import moment = require('moment')
import {DateTime} from './lib/dateTime'
import * as asyncHandler from 'express-async-handler'
import * as errorController from './lib/errorHandler'
import * as lusca from 'lusca'

Properties.initialize()
const logger = log4js.getLogger('server')
const nunjucks = require('nunjucks')
const jsonpath = require('jsonpath')
const appRoot = require('app-root-path')
const FileStore = sessionFileStore(session)
const {PORT = 3005} = process.env
const app = express()
const ctx = new ApplicationContext()
const i18n = require('i18n-express')
const authorisedRole = 'COURSE_MANAGER'

const appInsights = require('applicationinsights')

appInsights
	.setup(config.INSTRUMENTATION_KEY)
	.setAutoDependencyCorrelation(true)
	.setAutoCollectRequests(true)
	.setAutoCollectPerformance(true)
	.setAutoCollectExceptions(true)
	.setAutoCollectDependencies(true)
	.setAutoCollectConsole(true)
	.setUseDiskRetryCaching(true)
	.start()

app.use(
	i18n({
		translationsPath: appRoot + '/src/locale',
		siteLangs: ['en'],
		textsVarName: 'i18n',
	})
)

nunjucks
	.configure([appRoot + '/views', appRoot + '/node_modules/govuk-frontend/', appRoot + '/node_modules/govuk-frontend/components'], {
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

app.set('view engine', 'html')

app.use('/assets', serveStatic(appRoot + '/node_modules/govuk-frontend/assets'))
app.use('/js', serveStatic(appRoot + '/views/assets/js'))
app.use(serveStatic(appRoot + '/dist/views/assets'))
app.use('/govuk-frontend', serveStatic(appRoot + '/node_modules/govuk-frontend/'))
app.use('/sortablejs', serveStatic(appRoot + '/node_modules/sortablejs/'))

app.use(
	log4js.connectLogger(logger, {
		format: ':method :url',
		level: 'trace',
		nolog: '\\.js|\\.css|\\.gif|\\.jpg|\\.png|\\.ico$',
	})
)

app.use(cookieParser())

const appConfig = new AppConfig()
app.use(
	session({
		cookie: appConfig.cookie,
		name: appConfig.name,
		resave: appConfig.resave,
		saveUninitialized: appConfig.saveUninitialized,
		secret: appConfig.secret,
		store: new FileStore({path: appConfig.path}),
	})
)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use(lusca.csrf())

ctx.auth.configure(app, authorisedRole)
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

app.get('/', function(req, res) {
	res.redirect('/content-management')
})

app.get('/content-management', asyncHandler(ctx.homeController.index()))

app.use(errorController.handleError)

app.listen(PORT, () => logger.info(`LPG Management listening on port ${PORT}`))
