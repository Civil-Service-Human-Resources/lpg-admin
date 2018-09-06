var isValidDate = require('is-valid-date')

const isoRegex = new RegExp(
	'^(-)?P(?:(\\d+)Y)?(?:(\\d+)M)?(?:(\\d+)D)?' + '(T(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+(?:\\.\\d+)?)S)?)?$'
)

const dateRegex = new RegExp('^([12]\\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01]))$')

export function parseDuration(isoDuration: string): number | undefined {
	const parts = isoDuration.match(isoRegex)
	if (!parts) {
		return
	}
	// Abort if the duration specifies either year or month components.
	if (parts[2] || parts[3]) {
		return
	}
	let duration = 0
	duration += parseFloat(parts[8]) || 0
	duration += (parseInt(parts[7], 10) || 0) * 60
	duration += (parseInt(parts[6], 10) || 0) * 3600
	duration += (parseInt(parts[4], 10) || 0) * 86400
	// Accept the leading minus sign for now, but might want to abort in future.
	if (parts[1]) {
		return -duration
	}
	return duration
}

export function minDate(date: Date, minDate: Date): boolean {
	if (date < minDate) {
		return false
	}
	return true
}

export function validateDateTime(data: any, errors: any) {
	const startDate: Date = getDate(data, true)
	const endDate: Date = getDate(data, false)

	if (!minDate(startDate, new Date(Date.now()))) {
		errors.fields.minDate = ['validation.module.event.dateRanges.past']
	}
	if (!minDate(endDate, startDate)) {
		errors.fields.minTime = ['validation.module.event.dateRanges.endBeforeStart']
	}

	if (data.dateRanges) {
		if (
			!isValidDate(
				data.dateRanges[0].date.substr(8, 2) +
					'-' +
					data.dateRanges[0].date.substr(5, 2) +
					'-' +
					data.dateRanges[0].date.substr(0, 4)
			)
		) {
			errors.fields.invalidDate = ['validation.module.event.date.doesNotExist']
		}
	}

	let parts = null
	if (data.dateRanges) {
		parts = data.dateRanges[0].date.match(dateRegex)
	}
	if (!parts) {
		errors.fields.invalidDate = ['validation.module.event.date.invalidFormat']
	}
	return errors
}

export function getDate(data: any, start: boolean) {
	let date: Date = new Date()

	date.setFullYear(data['start-date-year'])
	date.setMonth(data['start-date-month'])
	date.setDate(data['start-date-day'])

	if (start) {
		date.setHours(data['start-time'][0])
		date.setMinutes(data['start-time'][1])
	} else {
		date.setHours(data['end-time'][0])
		date.setMinutes(data['end-time'][1])
	}

	date.setSeconds(0)
	date.setMilliseconds(0)

	return date
}

export function parseDate(data: any) {
	let dateRanges
	if (data['start-date-year'] && data['start-date-month'] && data['start-date-day']) {
		dateRanges = [{date: '', startTime: '', endTime: ''}]

		dateRanges[0].date = (
			data['start-date-year'] +
			'-' +
			data['start-date-month'] +
			'-' +
			data['start-date-day']
		).toString()

		dateRanges[0].startTime = (data['start-time'][0] + ':' + data['start-time'][1] + ':00').toString()
		dateRanges[0].endTime = (data['end-time'][0] + ':' + data['end-time'][1] + ':00').toString()
	}

	return dateRanges
}
