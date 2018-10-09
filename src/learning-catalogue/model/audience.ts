import {IsNotEmpty, MaxLength} from 'class-validator'

export class Audience {
	id: string

	@IsNotEmpty({
		groups: ['all', 'audience.all', 'audience.name'],
		message: 'audience.validation.name.empty',
	})
	@MaxLength(40, {
		groups: ['all', 'audience.all', 'audience.name'],
		message: 'audience.validation.name.maxLength',
	})
	name: string

	areasOfWork?: string[]

	departments?: string[]

	grades?: string[]

	interests?: string[]

	@IsNotEmpty({
		groups: ['all', 'audience.all', 'audience.type'],
		message: 'audience.validation.type.empty',
	})
	type: Audience.Type

	requiredBy?: Date

	frequency?: string

	eventId?: string
}

export namespace Audience {
	export enum Type {
		OPEN,
		CLOSED_COURSE,
		PRIVATE_COURSE,
		REQUIRED_LEARNING,
	}
}
