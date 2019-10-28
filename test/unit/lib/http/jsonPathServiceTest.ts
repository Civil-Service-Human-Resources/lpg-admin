import {beforeEach, describe, it} from 'mocha'
import * as chai from 'chai'
import * as sinonChai from 'sinon-chai'
import {JsonpathService} from '../../../../src/lib/jsonpathService'
import {expect} from 'chai'

chai.use(sinonChai)

describe('Tests for jsonpath serivce', () => {
    beforeEach(() => {})

    it('should accept dash include in a key in JSON', () => {
        const organisations =  {
            "co": "Cabinet Office",
            "test-org": "testOrg",
        }

        const query  = JsonpathService.query(organisations, '$.*')

        expect(query).to.equal('testOrg')
    })
})
