import {Auth} from '../identity/auth'
import {YoutubeRestService} from './youtubeRestService'
import {YoutubeConfig} from './youtubeConfig'
import {DateTime} from '../lib/dateTime'
import { getLogger } from '../utils/logger'

export class YoutubeService {
	logger = getLogger('YoutubeService')
	youtubeConfig: YoutubeConfig
	_restService: YoutubeRestService
	api_key: String
	public auth: Auth

	constructor(youtubeConfig: YoutubeConfig, auth: Auth, api_key: String) {
		this.youtubeConfig = youtubeConfig
		this.auth = auth
		this.api_key = api_key

		this._restService = new YoutubeRestService(youtubeConfig, this.auth)
	}

	async getYoutubeResponse(url: string) {
		try {
			return await this._restService.get(
				`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json&key=${
					this.api_key
				}`
			)
		} catch (err) {
			this.logger.error(`Error fetching metadata from YouTube: ${err}`)
		}
	}

	public checkYoutubeResponse(response: any): Boolean {
		if (response.type !== 'video' && response.html) {
			return false
		}

		const suffix = response.html.split('embed/')[1]
		if (!suffix) {
			return false
		}
		const id = suffix.split('?')[0]
		if (!id) {
			return false
		}

		return true
	}

	public getBasicYoutubeInfo(response: any) {
		const suffix = response.html.split('embed/')[1]
		const id = suffix.split('?')[0]

		return {
			height: response.height,
			id,
			thumbnail_height: response.thumbnail_height,
			thumbnail_url: response.thumbnail_url,
			thumbnail_width: response.thumbnail_width,
			title: response.title,
			width: response.width,
		}
	}

	async getDuration(videoID: string): Promise<number | undefined> {
		let resp

		try {
			resp = await this._restService.get(
				`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoID}&key=${
					this.api_key
				}`
			)
		} catch (err) {
			this.logger.error(`Error fetching metadata from YouTube: ${err}`)
			return
		}

		if (resp && resp.items && resp.items[0]) {
			return DateTime.parseDuration(resp.items[0].contentDetails.duration)
		}
	}
}
