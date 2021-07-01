import * as config from './config'
import {HomeController} from './controllers/homeController'
import axios, {AxiosInstance} from 'axios'
import {IdentityService} from './identity/identityService'
import {Auth} from './identity/auth'
import * as passport from 'passport'
import {AuthConfig} from './identity/authConfig'
import {IdentityConfig} from './identity/identityConfig'

import {LearningCatalogueConfig} from './learning-catalogue/learningCatalogueConfig'
import {LearningCatalogue} from './learning-catalogue'
import {EnvValue} from 'ts-json-properties'
import {CourseController} from './controllers/courseController'
import {CourseFactory} from './learning-catalogue/model/factory/courseFactory'
import {LearningProviderController} from './controllers/learningProvider/learningProviderController'
import {LearningProviderFactory} from './learning-catalogue/model/factory/learningProviderFactory'
import {CancellationPolicyFactory} from './learning-catalogue/model/factory/cancellationPolicyFactory'
import {TermsAndConditionsFactory} from './learning-catalogue/model/factory/termsAndConditionsFactory'
import {NextFunction, Request, Response} from 'express'
import {Pagination} from './lib/pagination'
import {CancellationPolicyController} from './controllers/learningProvider/cancellationPolicyController'
import {TermsAndConditionsController} from './controllers/learningProvider/termsAndConditionsController'
import {YoutubeModuleController} from './controllers/module/youtubeModuleController'
import {Validator} from './learning-catalogue/validator/validator'
import {LearningProvider} from './learning-catalogue/model/learningProvider'
import {CancellationPolicy} from './learning-catalogue/model/cancellationPolicy'
import {TermsAndConditions} from './learning-catalogue/model/termsAndConditions'
import {Course} from './learning-catalogue/model/course'
import {ModuleFactory} from './learning-catalogue/model/factory/moduleFactory'
import {AudienceFactory} from './learning-catalogue/model/factory/audienceFactory'
import {EventFactory} from './learning-catalogue/model/factory/eventFactory'
import {ModuleController} from './controllers/module/moduleController'
import {Module} from './learning-catalogue/model/module'
import {FileController} from './controllers/module/fileController'
import {LinkModuleController} from './controllers/module/linkModuleController'
import {FaceToFaceModuleController} from './controllers/module/faceToFaceModuleController'
import {EventController} from './controllers/module/event/eventController'
import {Event} from './learning-catalogue/model/event'
import {AudienceController} from './controllers/audience/audienceController'
import {Audience} from './learning-catalogue/model/audience'
import {CourseService} from './lib/courseService'
import {CsrsConfig} from './csrs/csrsConfig'
import {CsrsService} from './csrs/service/csrsService'
import {YoutubeService} from './youtube/youtubeService'
import {YoutubeConfig} from './youtube/youtubeConfig'
import {OauthRestService} from './lib/http/oauthRestService'
import {CacheService} from './lib/cacheService'
import {DateRangeCommand} from './controllers/command/dateRangeCommand'
import {DateRangeCommandFactory} from './controllers/command/factory/dateRangeCommandFactory'
import {DateRange} from './learning-catalogue/model/dateRange'
import {DateRangeFactory} from './learning-catalogue/model/factory/dateRangeFactory'
import {LinkModule} from './learning-catalogue/model/linkModule'
import {SearchController} from './controllers/searchController'
import {OrganisationController} from './controllers/organisationController'
import {Csrs} from './csrs'
import {OrganisationalUnitFactory} from './csrs/model/organisationalUnitFactory'
import {LearnerRecord} from './learner-record'
import {LearnerRecordConfig} from './learner-record/learnerRecordConfig'
import {InviteFactory} from './learner-record/model/factory/inviteFactory'
import {BookingFactory} from './learner-record/model/factory/bookingFactory'
import {Booking} from './learner-record/model/booking'
import {OrganisationalUnit} from './csrs/model/organisationalUnit'
import {ReportingController} from './controllers/reportingController'
import {OrganisationalUnitService} from './csrs/service/organisationalUnitService'
import {ReportServiceConfig} from './report-service/reportServiceConfig'
import {ReportService} from './report-service'
import {DateStartEndCommand} from './controllers/command/dateStartEndCommand'
import {DateStartEndCommandFactory} from './controllers/command/factory/dateStartEndCommandFactory'
import {DateStartEnd} from './learning-catalogue/model/dateStartEnd'
import {DateStartEndFactory} from './learning-catalogue/model/factory/dateStartEndFactory'
import {SkillsController} from './controllers/skills/skillsController'
import {AudienceService} from './lib/audienceService'
import {QuestionFactory} from './controllers/skills/questionFactory'
import {QuizFactory} from './controllers/skills/quizFactory'
import {Question} from "./controllers/skills/question"
import {AgencyTokenHttpService} from './csrs/agencyTokenHttpService'
import {AgencyToken} from './csrs/model/agencyToken'
import {AgencyTokenFactory} from './csrs/model/agencyTokenFactory'
import {AgencyTokenService} from './lib/agencyTokenService'
import {AgencyTokenController} from './controllers/agencyTokenController'
import {AgencyTokenCapacityUsedHttpService} from './identity/agencyTokenCapacityUsedHttpService'
import {AgencyTokenCapacityUsedFactory} from './identity/model/AgencyTokenCapacityUsedFactory'

export class ApplicationContext {
	identityService: IdentityService
	auth: Auth
	identityConfig: IdentityConfig
	axiosInstance: AxiosInstance
	cacheService: CacheService
	homeController: HomeController
	learningCatalogueConfig: LearningCatalogueConfig
	learningCatalogue: LearningCatalogue
	courseController: CourseController
	courseValidator: Validator<Course>
	courseFactory: CourseFactory
	learningProviderFactory: LearningProviderFactory
	cancellationPolicyFactory: CancellationPolicyFactory
	termsAndConditionsFactory: TermsAndConditionsFactory
	learningProviderValidator: Validator<LearningProvider>
	cancellationPolicyValidator: Validator<CancellationPolicy>
	termsAndConditionsValidator: Validator<TermsAndConditions>
	learningProviderController: LearningProviderController
	cancellationPolicyController: CancellationPolicyController
	termsAndConditionsController: TermsAndConditionsController
	moduleController: ModuleController
	linkModuleController: LinkModuleController
	moduleFactory: ModuleFactory
	youtubeModuleController: YoutubeModuleController
	moduleValidator: Validator<Module>
	linkModuleValidator: Validator<LinkModule>
	eventValidator: Validator<Event>
	audienceController: AudienceController
	audienceValidator: Validator<Audience>
	audienceFactory: AudienceFactory
	eventFactory: EventFactory
	fileController: FileController
	pagination: Pagination
	youtubeService: YoutubeService
	youtubeConfig: YoutubeConfig
	faceToFaceController: FaceToFaceModuleController
	eventController: EventController
	mediaConfig: LearningCatalogueConfig
	courseService: CourseService
	csrsConfig: CsrsConfig
	csrsService: CsrsService
	dateRangeCommandFactory: DateRangeCommandFactory
	dateStartEndCommandFactory: DateStartEndCommandFactory
	dateRangeCommandValidator: Validator<DateRangeCommand>
	dateStartEndCommandValidator: Validator<DateStartEndCommand>
	dateStartEndValidator: Validator<DateStartEnd>
	dateRangeFactory: DateRangeFactory
	dateStartEndFactory: DateStartEndFactory
	dateRangeValidator: Validator<DateRange>
	learnerRecord: LearnerRecord
	learnerRecordConfig: LearnerRecordConfig
	inviteFactory: InviteFactory
	bookingFactory: BookingFactory
	bookingValidator: Validator<Booking>
	organisationController: OrganisationController
	csrs: Csrs
	agencyTokenHttpService: AgencyTokenHttpService
	agencyTokenCapacityUsedHttpService: AgencyTokenCapacityUsedHttpService
	organisationalUnitFactory: OrganisationalUnitFactory
	organisationalUnitValidator: Validator<OrganisationalUnit>
	searchController: SearchController
	reportingController: ReportingController
	organisationalUnitService: OrganisationalUnitService
	reportServiceConfig: ReportServiceConfig
	reportService: ReportService
	skillsController: SkillsController
	audienceService: AudienceService
	agencyTokenFactory: AgencyTokenFactory
	agencyTokenValidator: Validator<AgencyToken>
	agencyTokenService: AgencyTokenService
	agencyTokenController: AgencyTokenController
	agencyTokenCapacityUsedFactory: AgencyTokenCapacityUsedFactory
	questionFactory: QuestionFactory
	quizFactory: QuizFactory
	questionValidator: Validator<Question>


	@EnvValue('LPG_UI_URL')
	public lpgUiUrl: String

	constructor() {
		this.axiosInstance = axios.create({
			headers: {
				'Content-Type': 'application/json',
			},
			timeout: config.REQUEST_TIMEOUT_MS,
		})

		this.identityService = new IdentityService(this.axiosInstance)

		this.auth = new Auth(
			new AuthConfig(
				config.AUTHENTICATION.clientId,
				config.AUTHENTICATION.clientSecret,
				config.AUTHENTICATION.authenticationServiceUrl,
				config.AUTHENTICATION.callbackUrl,
				config.AUTHENTICATION_PATH
			),
			passport,
			this.identityService
		)

		this.identityConfig = new IdentityConfig(config.AUTHENTICATION.authenticationServiceUrl, config.AUTHENTICATION.timeout)

		this.learningCatalogueConfig = new LearningCatalogueConfig(config.COURSE_CATALOGUE.url, config.COURSE_CATALOGUE.timeout)

		this.learningCatalogue = new LearningCatalogue(this.learningCatalogueConfig, this.auth)

		this.courseFactory = new CourseFactory()

		this.questionFactory = new QuestionFactory()

		this.quizFactory = new QuizFactory()

		this.pagination = new Pagination()

		this.cacheService = new CacheService({
			stdTTL: config.CACHE.TTL_SECONDS,
			checkperiod: config.CACHE.CHECK_PERIOD_SECONDS,
		})

		this.reportServiceConfig = new ReportServiceConfig(config.REPORT_SERVICE.url, config.REPORT_SERVICE.timeout, config.REPORT_SERVICE.map)
		this.reportService = new ReportService(this.reportServiceConfig, new OauthRestService(this.reportServiceConfig, this.auth))

		this.csrsConfig = new CsrsConfig(config.REGISTRY_SERVICE.url, config.REGISTRY_SERVICE.timeout)
		this.csrsService = new CsrsService(new OauthRestService(this.csrsConfig, this.auth), this.cacheService)

		this.courseValidator = new Validator<Course>(this.courseFactory)
		this.courseService = new CourseService(this.learningCatalogue)
		this.courseController = new CourseController(this.learningCatalogue, this.courseValidator, this.courseFactory, this.courseService, this.csrsService)

		this.homeController = new HomeController(this.learningCatalogue, this.pagination)
		this.learningProviderFactory = new LearningProviderFactory()
		this.cancellationPolicyFactory = new CancellationPolicyFactory()

		this.youtubeConfig = new YoutubeConfig(config.YOUTUBE.timeout)
		this.youtubeService = new YoutubeService(this.youtubeConfig, this.auth, config.YOUTUBE.api_key)
		this.audienceFactory = new AudienceFactory()
		this.eventFactory = new EventFactory()
		this.moduleFactory = new ModuleFactory()
		this.moduleValidator = new Validator<Module>(this.moduleFactory)
		this.youtubeModuleController = new YoutubeModuleController(this.learningCatalogue, this.moduleValidator, this.moduleFactory, this.youtubeService, this.courseService)

		this.termsAndConditionsFactory = new TermsAndConditionsFactory()
		this.learningProviderValidator = new Validator<LearningProvider>(this.learningProviderFactory)
		this.learningProviderValidator = new Validator<LearningProvider>(this.learningProviderFactory)
		this.cancellationPolicyValidator = new Validator<CancellationPolicy>(this.cancellationPolicyFactory)
		this.termsAndConditionsValidator = new Validator<TermsAndConditions>(this.termsAndConditionsFactory)

		this.learningProviderController = new LearningProviderController(this.learningCatalogue, this.learningProviderFactory, this.learningProviderValidator, this.pagination)

		this.cancellationPolicyFactory = new CancellationPolicyFactory()

		this.cancellationPolicyController = new CancellationPolicyController(this.learningCatalogue, this.cancellationPolicyFactory, this.cancellationPolicyValidator)

		this.termsAndConditionsFactory = new TermsAndConditionsFactory()

		this.termsAndConditionsController = new TermsAndConditionsController(this.learningCatalogue, this.termsAndConditionsFactory, this.termsAndConditionsValidator)

		this.mediaConfig = new LearningCatalogueConfig(config.COURSE_CATALOGUE.url + '/media', config.COURSE_CATALOGUE.timeout)

		this.moduleController = new ModuleController(this.learningCatalogue, this.moduleFactory)
		this.fileController = new FileController(
			this.learningCatalogue,
			this.moduleValidator,
			this.moduleFactory,
			new OauthRestService(this.mediaConfig, this.auth),
			this.courseService
		)
		this.linkModuleValidator = new Validator<LinkModule>(this.moduleFactory)
		this.linkModuleController = new LinkModuleController(this.learningCatalogue, this.moduleFactory, this.linkModuleValidator, this.courseService)

		this.faceToFaceController = new FaceToFaceModuleController(this.learningCatalogue, this.moduleValidator, this.moduleFactory, this.courseService)

		this.eventValidator = new Validator<Event>(this.eventFactory)

		this.dateRangeCommandFactory = new DateRangeCommandFactory()
		this.dateStartEndCommandFactory = new DateStartEndCommandFactory()
		this.dateStartEndFactory = new DateStartEndFactory()
		this.dateRangeCommandValidator = new Validator<DateRangeCommand>(this.dateRangeCommandFactory)
		this.dateStartEndCommandValidator = new Validator<DateStartEndCommand>(this.dateStartEndCommandFactory)
		this.dateStartEndValidator = new Validator<DateStartEnd>(this.dateStartEndFactory)
		this.dateRangeFactory = new DateRangeFactory()
		this.dateRangeValidator = new Validator<DateRange>(this.dateRangeFactory)

		this.bookingFactory = new BookingFactory()
		this.inviteFactory = new InviteFactory()

		this.learnerRecordConfig = new LearnerRecordConfig(config.LEARNER_RECORD.url, config.LEARNER_RECORD.timeout)
		this.learnerRecord = new LearnerRecord(this.learnerRecordConfig, this.auth, this.bookingFactory, this.inviteFactory)

		this.bookingValidator = new Validator<Booking>(this.bookingFactory)

		this.eventController = new EventController(
			this.learningCatalogue,
			this.learnerRecord,
			this.eventValidator,
			this.bookingValidator,
			this.eventFactory,
			this.inviteFactory,
			this.dateRangeCommandValidator,
			this.dateRangeValidator,
			this.dateRangeCommandFactory,
			this.identityService
		)

		this.audienceValidator = new Validator<Audience>(this.audienceFactory)
		this.csrs = new Csrs(this.csrsConfig, this.auth)
		this.agencyTokenHttpService = new AgencyTokenHttpService(this.csrsConfig, this.auth)
		this.agencyTokenCapacityUsedHttpService = new AgencyTokenCapacityUsedHttpService(this.identityConfig, this.auth)

		this.audienceService = new AudienceService(this.csrsService)
		this.audienceController = new AudienceController(
			this.learningCatalogue,
			this.audienceValidator,
			this.audienceFactory,
			this.courseService,
			this.csrsService,
			this.csrs,
			this.audienceService
		)
		this.organisationalUnitFactory = new OrganisationalUnitFactory()
		this.organisationalUnitValidator = new Validator<OrganisationalUnit>(this.organisationalUnitFactory)
		this.organisationalUnitService = new OrganisationalUnitService(this.csrs, this.organisationalUnitFactory, this.agencyTokenCapacityUsedHttpService)

		this.organisationController = new OrganisationController(this.csrs, this.organisationalUnitFactory, this.organisationalUnitValidator, this.organisationalUnitService)

		this.agencyTokenFactory = new AgencyTokenFactory()
		this.agencyTokenValidator = new Validator<AgencyToken>(this.agencyTokenFactory)
		this.agencyTokenService = new AgencyTokenService()
		this.agencyTokenController = new AgencyTokenController(
			this.agencyTokenValidator,
			this.agencyTokenService,
			this.organisationalUnitService,
			this.agencyTokenFactory,
			this.csrs
		)

		this.agencyTokenCapacityUsedFactory = new AgencyTokenCapacityUsedFactory()

		this.searchController = new SearchController(this.learningCatalogue, this.pagination)

		this.reportingController = new ReportingController(this.reportService, this.dateStartEndCommandFactory, this.dateStartEndCommandValidator, this.dateStartEndValidator)
		this.questionValidator = new Validator<Question>(this.questionFactory)
		this.skillsController = new SkillsController(this.csrsService, this.questionFactory, this.quizFactory, this.questionValidator)

	}

	addToResponseLocals() {
		return (req: Request, res: Response, next: NextFunction) => {
			res.locals.originalUrl = req.originalUrl
			res.locals.lpgUiUrl = this.lpgUiUrl
			res.locals.sessionFlash = req.session!.sessionFlash

			delete req.session!.sessionFlash

			next()
		}
	}
}
