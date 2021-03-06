import {beforeEach, describe, it} from 'mocha'
import {expect} from 'chai'
import {Module} from '../../../../src/learning-catalogue/model/module'

describe('Module tests', () => {
	let module: Module

	beforeEach(() => {
		module = new Module()
	})

	it('should be able to set id', () => {
		module.id = 'test-id'
		expect(module.id).to.equal('test-id')
	})

	it('should be able to set type', () => {
		module.type = Module.Type.LINK
		expect(module.type).to.equal(Module.Type.LINK)
	})

	it('should be able to set title', () => {
		module.title = 'test-title'
		expect(module.title).to.equal('test-title')
	})

	it('should be able to set description', () => {
		module.description = 'test-description'
		expect(module.description).to.equal('test-description')
	})

	it('should be able to set duration', () => {
		module.duration = 999
		expect(module.duration).to.equal(999)
	})

	it('should be able to set cost', () => {
		module.cost = 1000
		expect(module.cost).to.equal(1000)
	})
})
