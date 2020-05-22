import {OauthRestService} from '../../lib/http/oauthRestService'
import {JsonpathService} from '../../lib/jsonpathService'
import {CacheService} from '../../lib/cacheService'

export class CsrsService {
	restService: OauthRestService
	cacheService: CacheService

	static readonly DEPARTMENT_CODE_TO_NAME_MAPPING = 'CsrsService.departmentCodeToNameMapping'
	static readonly AREAS_OF_WORK = 'CsrsService.areasOfWork'
	static readonly GRADES = 'CsrsService.grades'
	static readonly GRADE_CODE_TO_NAME_MAPPING = 'CsrsService.gradeCodeToNameMapping'
	static readonly INTERESTS = 'CsrsService.interests'
	static readonly DEPARTMENT_CODE_TO_ABBREVIATION_MAPPING = 'CsrsService.departmentCodeToAbbreviationMapping'

	constructor(restService: OauthRestService, cacheService: CacheService) {
		this.restService = restService
		this.cacheService = cacheService
	}

	async getOrganisations() {
		return await this.restService.get('/organisationalUnits/normalised')
	}

	async getCivilServant() {
		return await this.restService.get('/civilServants/me')
	}

	async createQuizByProfessionID(id: any) {
		return await this.restService.postWithoutFollowing('/api/quiz', {id: id})
	}

	async deleteQuizByProfession(id: number): Promise<void> {
		await this.restService.delete(`/api/quiz/${id}/delete`)
	}

	async postQuestion(question: any) {
		return await this.restService.postWithoutFollowing('/api/questions/add-question', question)
	}

	async getQuestionsByProfession(id: any) {
		return await this.restService.get(`/api/quiz?professionId=${id}&limit=10`)
	}

	async getQuizByProfession(id: any) {
		return await this.restService.get(`/api/quiz/${id}/info`)
	}

	async getAreasOfWork() {
		let areasOfWork = await this.restService.get('/professions/flat')

		return areasOfWork
	}

	async isAreaOfWorkValid(areaOfWork: string) {
		const areaOfWorkLookupResult = JsonpathService.queryWithLimit(await this.getAreasOfWork(), `$..professions[?(@.name==${JSON.stringify(areaOfWork)})]`, 1)
		return areaOfWorkLookupResult.length > 0
	}

	async getGrades() {
		let grades = this.cacheService.cache.get(CsrsService.GRADES)

		if (!grades) {
			grades = await this.restService.get('/grades')
			this.cacheService.cache.set(CsrsService.GRADES, grades)
		}

		return grades
	}

	async isGradeCodeValid(gradeCode: string) {
		const gradesLookupResult = JsonpathService.queryWithLimit(await this.getGrades(), `$..grades[?(@.code==${JSON.stringify(gradeCode)})]`, 1)

		return gradesLookupResult.length > 0
	}

	async isCoreLearningValid(interest: string) {
		const interestsLookupResult = JsonpathService.queryWithLimit(await this.getCoreLearning(), `$..interests[?(@.name==${JSON.stringify(interest)})]`, 1)
		return interestsLookupResult.length > 0
	}

	async getCoreLearning() {
		let interests = this.cacheService.cache.get(CsrsService.INTERESTS)

		if (!interests) {
			interests = await this.restService.get('/interests')
			this.cacheService.cache.set(CsrsService.INTERESTS, interests)
		}

		return interests
	}

	async getDepartmentCodeToNameMapping() {
		return this.getCodeToNameMapping(this.getOrganisations, '$.*', CsrsService.DEPARTMENT_CODE_TO_NAME_MAPPING)
	}

	async getGradeCodeToNameMapping() {
		return this.getCodeToNameMapping(this.getGrades, '$._embedded.grades.*', CsrsService.GRADE_CODE_TO_NAME_MAPPING)
	}

	private async getCodeToNameMapping(functionToRetrieveMappingFromBackend: () => Promise<any>, pathForMapObjects: string, cacheKey: string) {
		let mapping = this.cacheService.cache.get(cacheKey)

		if (!mapping) {
			const codeNameObjectArray = JsonpathService.query(await functionToRetrieveMappingFromBackend.call(this), pathForMapObjects)

			mapping = codeNameObjectArray.reduce((map: any, object: any) => {
				map[object.code] = object.name
				return map
			}, {})

			this.cacheService.cache.set(cacheKey, mapping)
		}

		return mapping
	}

	async findByName(name: string) {
		return await this.restService.get(`/professions/search/findByName?name=${name}`)
	}

	async getDepartmentCodeToAbbreviationMapping() {
		return this.getCodeToAbbreviationMapping(this.getOrganisations, '$.*', CsrsService.DEPARTMENT_CODE_TO_ABBREVIATION_MAPPING)
	}

	private async getCodeToAbbreviationMapping(functionToRetrieveMappingFromBackend: () => Promise<any>, pathForMapObjects: string, cacheKey: string) {
		let mapping = this.cacheService.cache.get(cacheKey)

		if (!mapping) {
			const codeAbbreviationObjectArray = JsonpathService.query(await functionToRetrieveMappingFromBackend.call(this), pathForMapObjects)

			mapping = codeAbbreviationObjectArray.reduce((map: any, object: any) => {
				map[object.code] = object.abbreviation
				return map
			}, {})

			this.cacheService.cache.set(cacheKey, mapping)
		}

		return mapping
	}
}
