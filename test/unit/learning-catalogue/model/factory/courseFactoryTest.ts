import {ModuleFactory} from '../../../../../src/learning-catalogue/model/factory/moduleFactory'
import * as sinon from 'sinon'
import {beforeEach, describe, it} from 'mocha'
import {CourseFactory} from '../../../../../src/learning-catalogue/model/factory/courseFactory'
import {Course} from '../../../../../src/learning-catalogue/model/course'
import {expect} from 'chai'
import {Module} from '../../../../../src/learning-catalogue/model/module'
import * as sinonChai from 'sinon-chai'
import * as chai from 'chai'

chai.use(sinonChai)

describe('CourseFactory tests', () => {
	let moduleFactory: ModuleFactory
	let courseFactory: CourseFactory

	beforeEach(() => {
		moduleFactory = <ModuleFactory>{}
		courseFactory = new CourseFactory()
		courseFactory.moduleFactory = moduleFactory
	})

	it('should create a a Course from data', () => {
		const id: string = 'L1U3cK3GQtuf3iDg71NqJw'
		const title: string = 'Working with budgets'
		const shortDescription =
			'This topic introduces yo… governance processes.'
		const description: string =
			'You learn about creating…in government’ topic.'
		const learningOutcomes: string =
			'After completing this to…h the financial cycle'
		const moduleId1: string = 'jksdhskdjhsdfk'
		const courseModule1: Module = <Module>{}

		const data: object = {
			id: id,
			title: title,
			shortDescription: shortDescription,
			description: description,
			learningOutcomes: learningOutcomes,
			modules: [
				{
					id: moduleId1,
				},
			],
		}

		moduleFactory.create = sinon
			.stub()
			.returns(courseModule1)
			.withArgs({
				id: moduleId1,
			})

		const result: Course = courseFactory.create(data)

		expect(result.id).to.equal(id)
		expect(result.title).to.equal(title)
		expect(result.shortDescription).to.equal(shortDescription)
		expect(result.description).to.equal(description)
		expect(result.learningOutcomes).to.equal(learningOutcomes)
		expect(result.modules[0]).to.equal(courseModule1)
	})

	it('should add empty list if modules is null', () => {
		const id: string = 'L1U3cK3GQtuf3iDg71NqJw'
		const title: string = 'Working with budgets'
		const shortDescription =
			'This topic introduces yo… governance processes.'
		const description: string =
			'You learn about creating…in government’ topic.'
		const learningOutcomes: string =
			'After completing this to…h the financial cycle'

		const data: object = {
			id: id,
			title: title,
			shortDescription: shortDescription,
			description: description,
			learningOutcomes: learningOutcomes,
			modules: null,
		}

		moduleFactory.create = sinon.stub()

		const result: Course = courseFactory.create(data)

		expect(result.id).to.equal(id)
		expect(result.title).to.equal(title)
		expect(result.shortDescription).to.equal(shortDescription)
		expect(result.description).to.equal(description)
		expect(result.learningOutcomes).to.equal(learningOutcomes)
		expect(result.modules).to.eql([])
		expect(moduleFactory.create).to.not.have.been.called
	})

	it('should be able to set module factory', () => {
		const newModuleFactory: ModuleFactory = <ModuleFactory>{}
		courseFactory.moduleFactory = newModuleFactory
		return expect(courseFactory.moduleFactory).to.equal(newModuleFactory)
	})
})
