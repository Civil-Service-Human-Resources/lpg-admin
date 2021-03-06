import {beforeEach, describe, it} from 'mocha'
import {expect} from 'chai'
import {Course} from '../../../../src/learning-catalogue/model/course'
import {VideoModule} from '../../../../src/learning-catalogue/model/videoModule'
import {LinkModule} from '../../../../src/learning-catalogue/model/linkModule'
import {FaceToFaceModule} from '../../../../src/learning-catalogue/model/faceToFaceModule'
import {Module} from '../../../../src/learning-catalogue/model/module'
import {Event} from '../../../../src/learning-catalogue/model/event'
import {DateRange} from '../../../../src/learning-catalogue/model/dateRange'
import {Audience} from '../../../../src/learning-catalogue/model/audience'
import {Visibility} from '../../../../src/learning-catalogue/model/visibility'

describe('Course tests', () => {
	let course: Course

	beforeEach(() => {
		course = new Course()
	})

	it('should be able to set id', () => {
		course.id = 'test-id'
		expect(course.id).to.equal('test-id')
	})

	it('should be able to set title', () => {
		course.title = 'test-title'
		expect(course.title).to.equal('test-title')
	})

	it('should be able to set shortDescription', () => {
		course.shortDescription = 'test-shortDescription'
		expect(course.shortDescription).to.equal('test-shortDescription')
	})

	it('should be able to set description', () => {
		course.description = 'test-description'
		expect(course.description).to.equal('test-description')
	})

	it('should be able to set duration', () => {
		course.duration = 999
		expect(course.duration).to.equal(999)
	})

	it('should be able to set learningOutcomes', () => {
		course.learningOutcomes = 'test-learningOutcomes'
		expect(course.learningOutcomes).to.equal('test-learningOutcomes')
	})

	it('should be able to set topicId', () => {
		course.topicId = 'topicId'
		expect(course.topicId).to.equal('topicId')
	})

	it('should be able to set modules', () => {
		const modules = [new Module()]

		course.modules = modules

		expect(course.modules).to.equal(modules)
	})

	it('should populate duration values extracted from module duration', () => {
		course.duration = 115200
		expect(course.getDuration()).to.equal('4 days ')
	})

	describe('#getCost', () => {
		let module1: VideoModule
		let module2: LinkModule
		let module3: FaceToFaceModule

		beforeEach(() => {
			module1 = new VideoModule()
			module2 = new LinkModule()
			module3 = new FaceToFaceModule()
			course.modules = [module1, module2, module3]
		})

		it('should be able to get cost by sum of module costs', () => {
			module1.cost = 100
			module2.cost = 50
			module3.cost = 25.25

			expect(course.getCost()).to.equal(175.25)
		})

		it('should get 0 if there are no modules', () => {
			course.modules = []

			expect(course.getCost()).to.equal(0)
		})

		it('should get 0 if all module costs are missing', () => {
			delete module1.cost
			delete module2.cost
			delete module3.cost

			expect(course.getCost()).to.equal(0)
		})

		it('should get a sum even if any of the module costs is missing', () => {
			delete module1.cost
			module2.cost = 50
			module3.cost = 20

			expect(course.getCost()).to.equal(70)
		})
	})

	describe('#getType', () => {
		it('should get type to be undefined if no modules', () => {
			course.modules = []

			expect(course.getType()).to.be.undefined
		})

		it('should get type to be blended if more than one module', () => {
			course.modules = [new Module(), new Module(), new Module()]

			expect(course.getType()).to.equal('blended')
		})

		it('should get type to be type of module if only one module', () => {
			const module1 = new Module()
			module1.type = Module.Type.VIDEO

			course.modules = [module1]

			expect(course.getType()).to.equal('video')
		})
	})

	it('should be able to get first available date', () => {
		const module1 = new FaceToFaceModule()
		const event1 = new Event()
		const event2 = new Event()
		const dateRange1 = new DateRange()
		const dateRange2 = new DateRange()

		const date1 = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
		const date2 = new Date(new Date().setFullYear(new Date().getFullYear() + 2))

		//date1.getMonth() or date2.getMonth() returns the value from 0 to 11
		//hence to get the correct month 1 need to be added to the value
		const formattedDate1 = date1.getFullYear() + '-' + (date1.getMonth() + 1) + '-' + date1.getDate()
		const formattedDate2 = date2.getFullYear() + '-' + (date2.getMonth() + 1) + '-' + date2.getDate()

		dateRange1.date = formattedDate1
		dateRange2.date = formattedDate2

		event1.dateRanges = [dateRange1]
		event2.dateRanges = [dateRange2]

		module1.events = [event1, event2]
		module1.type = Module.Type.FACE_TO_FACE

		course.modules = [module1]

		expect(course.getNextAvailableDate()).to.equal(formattedDate1)
	})

	it('should return undefined when no face to face modules exist', () => {
		const module1 = new Module()
		module1.type = Module.Type.E_LEARNING

		course.modules = [module1]

		expect(course.getNextAvailableDate()).to.be.undefined
	})

	it('should return undefined when no dates exist', () => {
		const module1 = new FaceToFaceModule()
		const event1 = new Event()

		module1.events = [event1]
		module1.type = Module.Type.FACE_TO_FACE

		course.modules = [module1]

		expect(course.getNextAvailableDate()).to.be.undefined
	})

	it('should be able to get grades', () => {
		const audience1 = new Audience()
		const audience2 = new Audience()
		audience1.grades = ['One', 'Two']
		audience2.grades = ['Three']

		course.audiences = [audience1, audience2]

		expect(course.getGrades()).to.be.equal('One,Two,Three')
	})

	it('should return empty string if no grades exist', () => {
		const audience1 = new Audience()
		const audience2 = new Audience()

		course.audiences = [audience1, audience2]

		expect(course.getGrades()).to.be.equal('')
	})

	it('should return empty string no audiences exist', () => {
		expect(course.getGrades()).to.be.equal('')
	})

	it('should be able to get areas of work', () => {
		const audience1 = new Audience()
		const audience2 = new Audience()

		audience1.areasOfWork = ['One', 'Two']
		audience2.areasOfWork = ['Three']

		course.audiences = [audience1, audience2]

		expect(course.getAreasOfWork()).to.be.equal('One,Two,Three')
	})

	it('should return empty string if no areas of work exist', () => {
		const audience1 = new Audience()

		course.audiences = [audience1]

		expect(course.getAreasOfWork()).to.be.equal('')
	})

	it('should return empty string if no audiences exist', () => {
		expect(course.getAreasOfWork()).to.be.equal('')
	})

	it('should be able to set visibility', () => {
		course.visibility = Visibility.PRIVATE
		expect(course.visibility).to.be.equal(Visibility.PRIVATE)
	})
})
