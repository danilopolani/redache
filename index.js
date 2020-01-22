const redis = require('redis')
const moment = require('moment')
const { promisify } = require('util')

/**
 * Cache class.
 *
 * @class
 *
 * @property {object} client - Redis client
 */
module.exports = class Cache {
  /**
   * Initialize a new cache instance.
   *
   * @constructor
   *
   * @param {object} config - See https://github.com/NodeRedis/node_redis#options-object-properties for all the available options.
   */
  constructor (config) {
    this.client = redis.createClient(config)

    // Promisify redis methods
    this._redisGet = promisify(this.client.get).bind(this.client)
    this._redisSetex = promisify(this.client.setex).bind(this.client)
    this._redisDel = promisify(this.client.del).bind(this.client)
  }

  /**
   * Get a value from the cache.
   * If no fallback is provided and value can't be found or is expired, returns null.
   *
   * @param {string} key
   * @param {any} fallback - If provided, this will be returned and set as fallback cache when key is not found
   * @param {string|Date|moment|number} ttl - Fallback TTL. Can be a human readable format (like '1 day'), a date, a moment instance or seconds.
   * @return {any}
   */
  async get (key, fallback, ttl) {
    // Get item
    const item = await this._redisGet(key)
    if (item !== null) {
      return typeof item === 'string' && this._isJSON(item) ? JSON.parse(item) : item
    }

    // If no fallback has been provided, return null
    if (typeof fallback === 'undefined' || fallback === null) {
      return null
    }

    // If fallback is a function, get the value from it
    let fallbackValue = fallback
    if (typeof fallback === 'function') {
      fallbackValue = await fallback()
    }

    // Set cache
    await this.set(key, fallbackValue, ttl)

    return fallbackValue
  }

  /**
   * Save a value in the cache.
   *
   * @example
   * cache.get('my-key', 'foobar', '6 hours') // Expires in 6 hours
   * @example
   * cache.get('my-key', 'foobar', new Date(2050, 1, 1)) // Expires the 1st Jan 2050
   * @example
   * cache.get('my-key', 'foobar', moment().add(1, 'month')) // Expires in 1 month
   * @example
   * cache.get('my-key', 'foobar', 3600) // Expires in 3600 seconds (1h)
   *
   * @param {string} key
   * @param {any} value
   * @param {string|Date|moment|number} ttl - Can be a human readable format (like '1 day'), a date, a moment instance or seconds.
   */
  async set (key, value, ttl) {
    let cacheExpiration = 0
    const today = moment()

    if (typeof ttl === 'string' && ttl.indexOf(' ') > -1) {
      // Allow unit format, example: 1 day, 5 years, 4 hours
      const [unitAmount, unitSymbol] = ttl.split(' ')

      // Validate unit amount
      if (!/\d+/.test(unitAmount)) {
        throw new Error(`TTL unit amount ${unitAmount} must be numeric.`)
      }

      // Validate unit symbol
      if (!moment.normalizeUnits(unitSymbol)) {
        throw new Error(`TTL unit symbol ${unitSymbol} is not valid.`)
      }

      cacheExpiration = moment().add(unitAmount, unitSymbol).diff(today, 'seconds')
    } else if (ttl instanceof Date) {
      // Date() object as param
      cacheExpiration = moment(ttl).diff(today, 'seconds')
    } else if (ttl instanceof moment) {
      // moment() instance as param
      cacheExpiration = ttl.diff(today, 'seconds')
    } else if (typeof ttl === 'number') {
      // If number, consider it as seconds
      cacheExpiration = ttl
    } else {
      throw new Error('Cannot parse TTL.')
    }

    await this._redisSetex(key, cacheExpiration, typeof value === 'object' ? JSON.stringify(value) : value)
  }

  /**
   * Delete a key from cache.
   *
   * @param {string} key
   */
  async forget (key) {
    await this._redisDel(key)
  }

  /**
   * Check if a string is a JSON.
   *
   * @private
   *
   * @param {string} str
   * @return {boolean}
   */
  _isJSON (str) {
    try {
      const result = JSON.parse(str)
      const type = Object.prototype.toString.call(result)
      return type === '[object Object]' || type === '[object Array]'
    } catch (err) {
      return false
    }
  }
}
