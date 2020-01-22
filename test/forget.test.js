const chai = require('chai')
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

describe('#forget()', () => {
  it('should delete the given key', async () => {
    await cacheInstance.set('key', 'value', '1 hour')

    // Assert that we really have created the key in Redis
    expect(cacheInstance.get('key')).to.become('value')

    // Now remove the key
    await cacheInstance.forget('key')

    expect(cacheInstance.get('key')).to.become(null)
  })
})
