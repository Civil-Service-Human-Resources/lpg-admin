import {EntityService} from '../learning-catalogue/service/entityService'
import {OrganisationalUnit} from '../controllers/organisation/model/organisationalUnit'
import {OauthRestService} from '../lib/http/oauthRestService'
import {Auth} from '../identity/auth'
import {OrganisationalUnitFactory} from '../controllers/organisation/model/organisationalUnitFactory'
import {DefaultPageResults} from '../learning-catalogue/model/defaultPageResults'
import {CsrsConfig} from './csrsConfig'

export class Csrs {
	private _organisationalUnitService: EntityService<OrganisationalUnit>
	private _restService: OauthRestService

	constructor(config: CsrsConfig, auth: Auth) {
		this._restService = new OauthRestService(config, auth)
		this._organisationalUnitService = new EntityService<OrganisationalUnit>(this._restService, new OrganisationalUnitFactory())
	}

	async listOrganisationalUnits(): Promise<DefaultPageResults<OrganisationalUnit>> {
		return await this._organisationalUnitService.listAll(`/organisationalUnits/tree`)
	}

	set organisationalUnitService(value: EntityService<OrganisationalUnit>) {
		this._organisationalUnitService = value
	}
}
