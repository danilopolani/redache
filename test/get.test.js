const chai = require('chai')
const redis = require('redis')
const Redache = require('../index')
const { promisify } = require('util')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect

// Use chai-as-promised to check for Promise responses
chai.use(chaiAsPromised)

// Redis config
const config = {
  host: 'redache_redis'
}

// Init cache instance
const cacheInstance = new Redache(config)
const redisInstance = redis.createClient(config)

// Promisify redis methods
const redisTtl = promisify(redisInstance.ttl).bind(redisInstance)

// Delete `key` from redis before each test
beforeEach(async () => redisInstance.del('key'))

describe('#get()', () => {
  describe('General', () => {
    it('should return null for a not found key', async () => {
      expect(cacheInstance.get('key')).to.become(null)
    })

    it('should return correct value', async () => {
      await cacheInstance.set('key', 'foo', '1 hour')

      expect(cacheInstance.get('key')).to.become('foo')
    })

    it('should return an object', async () => {
      await cacheInstance.set('key', { foo: 'bar' }, '1 hour')

      expect(cacheInstance.get('key')).to.become({ foo: 'bar' })
    })

    it('should return an array', async () => {
      await cacheInstance.set('key', [1, 2, 3], '1 hour')

      expect(cacheInstance.get('key')).to.become([1, 2, 3])
    })
  })

  describe('Fallback', () => {
    it('should not save a fallback if ttl is not provided as well', async () => {
      // Make sure our key is not present
      expect(cacheInstance.get('key')).to.become(null)

      // Invoke `get()` with a callback
      const value = await cacheInstance.get('key', 'foo')
      expect(value).to.equal(null)

      // Make sure our value has NOT been saved
      expect(cacheInstance.get('key')).to.become(null)
    })

    it('should save a fallback value when the key is not found', async () => {
      // Make sure our key is not present
      expect(cacheInstance.get('key')).to.become(null)

      // Invoke `get()` with a callback
      const value = await cacheInstance.get('key', 'foobar', '1 hour')
      expect(value).to.equal('foobar')

      // Make sure our value has been saved
      expect(cacheInstance.get('key')).to.become('foobar')

      // Make sure TTL is correct
      expect(redisTtl('key')).to.become(3600)
    })

    it('should save a fallback function when the key is not found', async () => {
      // Make sure our key is not present
      expect(cacheInstance.get('key')).to.become(null)

      // Invoke `get()` with a callback
      const value = await cacheInstance.get('key', () => 'foobar', '1 hour')
      expect(value).to.equal('foobar')

      // Make sure our value has been saved
      expect(cacheInstance.get('key')).to.become('foobar')

      // Make sure TTL is correct
      expect(redisTtl('key')).to.become(3600)
    })

    it('should save a fallback async function when the key is not found', async () => {
      // Make sure our key is not present
      expect(cacheInstance.get('key')).to.become(null)

      // Invoke `get()` with a callback
      const value = await cacheInstance.get('key', async () => Promise.resolve('foobar'), '1 hour')
      expect(value).to.equal('foobar')

      // Make sure our value has been saved
      expect(cacheInstance.get('key')).to.become('foobar')

      // Make sure TTL is correct
      expect(redisTtl('key')).to.become(3600)
    })
  })
})
