const chai = require('chai')
const redis = require('redis')
const Cache = require('../index')
const chaiAsPromised = require('chai-as-promised')

const expect = chai.expect

// Use chai-as-promised to check for Promise responses
chai.use(chaiAsPromised)

// Redis config
const config = {
  host: 'redache_redis'
}

// Init cache instance
const cacheInstance = new Cache(config)
const redisInstance = redis.createClient(config)

describe('#set()', () => {
  describe('human readable TTL', () => {
    it('should throw error if given TTL is not recognized', async () => {
      expect(cacheInstance.set('key', 'value', 'wrongttl')).to.be.rejectedWith('Cannot parse TTL.')
    })

    it('should throw error if given human-readable TTL unit amount is not valid', async () => {
      expect(cacheInstance.set('key', 'value', 'foo days')).to.be.rejectedWith('TTL unit amount foo must be numeric.')
    })

    it('should throw error if given human-readable TTL unit symbol is not valid', async () => {
      expect(cacheInstance.set('key', 'value', '5 foo')).to.be.rejectedWith('TTL unit symbol foo is not valid.')
    })
  })
})
