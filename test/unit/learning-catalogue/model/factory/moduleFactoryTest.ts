import {beforeEach, describe, it} from 'mocha'
import * as chai from 'chai'
import {expect} from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import {AudienceFactory} from '../../../../../src/learning-catalogue/model/factory/audienceFactory'
import {ModuleFactory} from '../../../../../src/learning-catalogue/model/factory/moduleFactory'
import {EventFactory} from '../../../../../src/learning-catalogue/model/factory/eventFactory'

chai.use(chaiAsPromised)

describe('ModuleFactory tests', () => {
	let eventFactory: EventFactory
	let audienceFactory: AudienceFactory
	let moduleFactory: ModuleFactory
	let data: any

	beforeEach(() => {
		eventFactory = new EventFactory()
		audienceFactory = new AudienceFactory()

		moduleFactory = new ModuleFactory(audienceFactory, eventFactory)

		data = {
			id: 'MBlZJv-ZRDCYZsCByjzRuQ',
			title: 'module title',
			description: 'module description',
			url: 'module url',
			duration: 3600,
			price: 100,
			audiences: [
				{
					areasOfWork: ['digital'],
					departments: ['co', 'hmrc'],
					grades: ['AA', 'G7'],
					interests: ['project management'],
					requiredBy: '2019-01-01T00:00:00',
					frequency: 'YEARLY',
					mandatory: true,
				},
			],
		}
	})

	const testProperties = (module: any, data: any, exclude: string[] = []) => {
		for (const property in module) {
			if (exclude.includes(property)) {
				continue
			}

			if (module.hasOwnProperty(property)) {
				expect(module[property]).to.deep.equal(data[property])
			}
		}
	}

	it('should create LinkModule', async () => {
		data.url = 'http://example.org'
		data.type = 'link'
		data.moduleTitle = 'module title'
		data.description = 'this a description'

		const module = await moduleFactory.create(data)

		testProperties(module, data, ['audiences'])
		testProperties(module.audiences[0], data.audiences[0], ['requiredBy'])

		expect(module.audiences[0].requiredBy!.toISOString().substr(0, 19)).to.equal(data.audiences[0].requiredBy)
	})

	it('should create ELearningModule', async () => {
		data.startPage = 'start-page'
		data.type = 'elearning'

		const module = await moduleFactory.create(data)

		testProperties(module, data, ['audiences'])

		expect(module.audiences[0].requiredBy!.toISOString().substr(0, 19)).to.equal(data.audiences[0].requiredBy)

		expect(module.startPage).to.equal(data.startPage)
	})

	it('should create FaceToFaceModule', async () => {
		data.type = 'face-to-face'
		data.productCode = 'product-code'
		data.events = [
			{
				id: 'XEbjXzmVQwSQ_7qIvr7Kew',
				venue: {
					location: 'London',
					address: 'SE1',
					capacity: 99,
					minCapacity: 10,
				},
				dateRanges: [{date: '2019-01-01', startTime: '09:00:00', endTime: '17:00:00'}],
			},
		]

		const module = await moduleFactory.create(data)

		testProperties(module, data, ['audiences', 'events'])

		testProperties(module.audiences[0], data.audiences[0], ['requiredBy'])
		testProperties(module.events[0], data.events[0], ['date'])

		expect(module.audiences[0].requiredBy!.toISOString().substr(0, 19)).to.equal(data.audiences[0].requiredBy)
		expect(module.events[0].dateRanges[0].date).to.be.equal('2019-01-01')
		expect(module.events[0].dateRanges[0].startTime).to.be.equal('09:00:00')
		expect(module.events[0].dateRanges[0].endTime).to.be.equal('17:00:00')
	})

	it('should set events and audiences to empt lists of missing', async () => {
		data.type = 'face-to-face'
		data.productCode = 'product-code'
		data.audiences = undefined

		const module = await moduleFactory.create(data)

		testProperties(module, data, ['audiences', 'events'])

		expect(module.audiences).to.eql([])
		expect(module.events).to.eql([])
	})

	it('should create FileModule', async () => {
		data.type = 'file'
		data.fileSize = 99
		data.url = 'http://example.org'

		const module = await moduleFactory.create(data)

		testProperties(module, data, ['audiences'])
		testProperties(module.audiences[0], data.audiences[0], ['requiredBy'])

		expect(module.audiences[0].requiredBy!.toISOString().substr(0, 19)).to.equal(data.audiences[0].requiredBy)
	})

	it('should create VideoModule', async () => {
		data.type = 'video'
		data.location = 'http://example.org'

		const module = await moduleFactory.create(data)

		testProperties(module, data, ['audiences'])
		testProperties(module.audiences[0], data.audiences[0], ['requiredBy'])

		expect(module.audiences[0].requiredBy!.toISOString().substr(0, 19)).to.equal(data.audiences[0].requiredBy)
	})

	it('should throw error if type is not recognised', async () => {
		data.type = 'unknown'
		expect(function() {
			moduleFactory.create(data)
		}).to.throw(`Unknown module type: unknown ${JSON.stringify(data)}`)
	})
})
