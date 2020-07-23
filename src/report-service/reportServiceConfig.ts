import * as config from '../config'

export class ReportServiceConfig {
	private _url: string
	private _timeout: number
	private _map: any

	constructor(url: string = config.REPORT_SERVICE.url, timeout: number = 550000, map: any = config.REPORT_SERVICE.map) {
		this._url = url
		this._timeout = timeout
		this._map = map
	}

	get url(): string {
		return this._url
	}

	get timeout(): number {
		return this._timeout
	}

	get map(): any {
		return this._map
	}
}
