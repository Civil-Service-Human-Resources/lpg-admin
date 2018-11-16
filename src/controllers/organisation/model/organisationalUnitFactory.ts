import {OrganisationalUnit} from './organisationalUnit'

export class OrganisationalUnitFactory {
	constructor() {
		this.create = this.create.bind(this)
	}

	public create(data: any): any {
		const organisationalUnit: OrganisationalUnit = new OrganisationalUnit()

		organisationalUnit.id = data.id
		organisationalUnit.name = data.name
		organisationalUnit.code = data.code
		organisationalUnit.paymentMethods = data.paymentMethods
		organisationalUnit.subOrgs = data.subOrgs
		organisationalUnit.parent = data.organisationalUnit
		organisationalUnit.abbreviation = data.abbreviation

		return organisationalUnit
	}
}
