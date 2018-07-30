import {Module} from './module'
import {IsNotEmpty, MaxLength} from 'class-validator'

export class Course {
	public id: string

	@IsNotEmpty({
		groups: ['all', 'title'],
		message: 'validation.course.title.empty',
	})
	public title: string

	@IsNotEmpty({
		groups: ['all', 'shortDescription'],
		message: 'validation.course.shortDescription.empty',
	})
	@MaxLength(160, {
		groups: ['all', 'shortDescription'],
		message: 'validation.course.shortDescription.maxLength',
	})
	public shortDescription: string

	@IsNotEmpty({
		groups: ['all', 'description'],
		message: 'validation.course.description.empty',
	})
	@MaxLength(1500, {
		groups: ['all', 'description'],
		message: 'validation.course.description.maxLength',
	})
	description: string
	duration: number
	learningOutcomes: string
	price: number | 'Free'
	modules: Module[]

	// get getId(): string {
	// 	return this.id
	// }
	//
	// set setId(value: string) {
	// 	this.id = value
	// }
	//
	// get title(): string {
	// 	return this.title
	// }
	//
	// set title(value: string) {
	// 	this.title = value
	// }
	//
	// get shortDescription(): string {
	// 	return this._shortDescription
	// }
	//
	// set shortDescription(value: string) {
	// 	this._shortDescription = value
	// }
	//
	// get description(): string {
	// 	return this._description
	// }
	//
	// set description(value: string) {
	// 	this._description = value
	// }
	//
	// get duration(): number {
	// 	return this._duration
	// }
	//
	// set duration(value: number) {
	// 	this._duration = value
	// }
	//
	// get learningOutcomes(): string {
	// 	return this._learningOutcomes
	// }
	//
	// set learningOutcomes(value: string) {
	// 	this._learningOutcomes = value
	// }
	//
	// get price() {
	// 	return this._price
	// }
	//
	// set price(value) {
	// 	this._price = value
	// }
	//
	// get modules(): Module[] {
	// 	return this._modules
	// }
	//
	// set modules(value: Module[]) {
	// 	this._modules = value
	// }

	getCost() {
		const costArray = this.modules.map(module => module.price)
		return costArray.length
			? costArray.reduce((p, c) => (p || 0) + (c || 0), 0)
			: null
	}

	getType() {
		if (!this.modules.length) {
			return null
		}
		if (this.modules.length > 1) {
			return 'blended'
		}
		return this.modules[0].type
	}
}
