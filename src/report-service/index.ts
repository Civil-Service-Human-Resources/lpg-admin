import {ReportServiceConfig} from './reportServiceConfig'
import {OauthRestService} from '../lib/http/oauthRestService'
import {DateStartEnd} from '../learning-catalogue/model/dateStartEnd'

export class ReportService {
	config: ReportServiceConfig
	http: OauthRestService

	constructor(config: ReportServiceConfig, http: OauthRestService) {
		this.config = config
		this.http = http
	}

	getReportBookingInformation(dateRange: DateStartEnd) {
		const reportUrl = `${this.config.url}/bookings?from=${dateRange.startDate}&to=${dateRange.endDate}`

		return this.http.get(reportUrl)
	}

	getReportLearnerRecord(dateRange: DateStartEnd) {
		const reportUrl = `${this.config.url}/modules?from=${dateRange.startDate}&to=${dateRange.endDate}`

		return this.http.get(reportUrl)
	}

	getReportForMandatoryCourses(dateRange: DateStartEnd) {
		const reportUrl = `${this.config.url}/mandatory-courses?from=${dateRange.startDate}&to=${dateRange.endDate}`

		return this.http.get(reportUrl)
	}
}
