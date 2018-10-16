import {EventFactory} from './eventFactory'
import {FaceToFaceModule} from '../faceToFaceModule'
import {VideoModule} from '../videoModule'
import {LinkModule} from '../linkModule'
import {FileModule} from '../fileModule'
import {ELearningModule} from '../eLearningModule'
import {Module} from '../module'

export class ModuleFactory {
	private eventFactory: EventFactory

	constructor(eventFactory: EventFactory = new EventFactory()) {
		this.eventFactory = eventFactory

		this.defaultCreate = this.defaultCreate.bind(this)
		this.create = this.create.bind(this)
	}

	public defaultCreate(module: any, data: any) {
		module.id = data.id
		module.type = data.type
		module.title = data.title
		module.description = data.description
		module.duration = data.duration
		module.cost = data.cost
		module.optional = data.optional

		return module
	}

	public create(data: any) {
		if (this.createMethods.hasOwnProperty(data.type)) {
			return (this.createMethods as any)[data.type](data)
		} else {
			throw new Error(`Unknown module type: ${data.type} ${JSON.stringify(data)}`)
		}
	}

	private createMethods: {[key in Module.Type]: any} = {
		video: (data: any) => {
			const module = this.defaultCreate(new VideoModule(), data)
			module.location = data.location
			module.url = data.url
			return module
		},
		link: (data: any) => {
			const module = this.defaultCreate(new LinkModule(), data)
			module.description = data.description
			module.duration = data.duration
			module.id = data.id
			module.isOptional = data.isOptional
			module.title = data.title
			module.url = data.url
			return module
		},
		file: (data: any) => {
			const module = this.defaultCreate(new FileModule(), data)
			module.fileSize = data.fileSize
			module.mediaId = data.mediaId
			module.url = data.url
			return module
		},
		'face-to-face': (data: any) => {
			const module = this.defaultCreate(new FaceToFaceModule(), data)
			module.events = (data.events || []).map(this.eventFactory.create)
			module.productCode = data.productCode
			return module
		},
		elearning: (data: any) => {
			const module = this.defaultCreate(new ELearningModule(), data)
			module.startPage = data.startPage
			module.url = data.url
			return module
		},
	}
}
