import {IsNotEmpty, ValidateNested} from 'class-validator'
import {DateRange} from './DateRange'
import {Venue} from "./venue";

export class Event {
	id: string

	@IsNotEmpty({
		groups: ['all', 'event.all', 'event.dateRanges'],
		message: 'validation_module_event_dateRanges_empty',
	})
	dateRanges: Array<DateRange> | undefined

	@ValidateNested({
		groups: ['all', 'event.all', 'event.location'],
	})
	venue: Venue
}
