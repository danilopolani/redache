const chai = require('chai')
const redis = require('redis')
const moment = require('moment')
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
const redisGet = promisify(redisInstance.get).bind(redisInstance)
const redisTtl = promisify(redisInstance.ttl).bind(redisInstance)

// Delete `key` from redis before each test
beforeEach(async () => redisInstance.del('key'))

describe('#set()', () => {
  describe('Human readable TTL', () => {
    it('should throw error if given human-readable TTL unit amount is not valid', async () => {
      expect(cacheInstance.set('key', 'value', 'foo days')).to.be.rejectedWith('TTL unit amount foo must be numeric.')
    })

    it('should throw error if given human-readable TTL unit symbol is not valid', async () => {
      expect(cacheInstance.set('key', 'value', '5 foo')).to.be.rejectedWith('TTL unit symbol foo is not valid.')
    })

    it('should save a value for the given amount of time', async () => {
      await cacheInstance.set('key', 'value', '1 hour')

      expect(redisGet('key')).to.not.be.rejected
      expect(redisGet('key')).to.become('value')
      expect(redisTtl('key')).to.become(3600)
    })
  })

  describe('Date() instance', () => {
    it('should save a value for the given amount of time', async () => {
      // Set the date with +1h
      const date = new Date()
      date.setHours(date.getHours() + 1)

      await cacheInstance.set('key', 'value', date)

      expect(redisGet('key')).to.not.be.rejected
      expect(redisGet('key')).to.become('value')
      expect(redisTtl('key')).to.become(3600)
    })
  })

  describe('moment() instance', () => {
    it('should save a value for the given amount of time', async () => {
      await cacheInstance.set('key', 'value', moment().add(1, 'hour'))

      expect(redisGet('key')).to.not.be.rejected
      expect(redisGet('key')).to.become('value')
      expect(redisTtl('key')).to.become(3600)
    })
  })

  describe('TTL as seconds', () => {
    it('should save a value for the given amount of time', async () => {
      await cacheInstance.set('key', 'value', 3600)

      expect(redisGet('key')).to.not.be.rejected
      expect(redisGet('key')).to.become('value')
      expect(redisTtl('key')).to.become(3600)
    })
  })

  describe('Invalid TTL', () => {
    it('should throw error if given TTL is not recognized', async () => {
      expect(cacheInstance.set('key', 'value', 'wrongttl')).to.be.rejectedWith('Cannot parse TTL.')
      expect(cacheInstance.set('key', 'value', {})).to.be.rejectedWith('Cannot parse TTL.')
      expect(cacheInstance.set('key', 'value', [])).to.be.rejectedWith('Cannot parse TTL.')
    })
  })
})
