# Redache

[![npm version](https://badge.fury.io/js/redache.svg)](https://badge.fury.io/js/redache)
[![Build Status](https://travis-ci.org/danilopolani/redache.svg?branch=master)](https://travis-ci.org/danilopolani/redache)
[![Coverage Status](https://coveralls.io/repos/github/danilopolani/redache/badge.svg?branch=master)](https://coveralls.io/github/danilopolani/redache?branch=master)

Easy redis cache library.

----

## Installation

Install Redache with your preferred package manager:

```
yarn add redache

# or

npm i --save redache
```

Then include it in your project:

```js
# CommonJS way
const Redache = require('redache')

# ES6
import Redache from 'redache'
```

## Configuration
The Redache constructor accepts an object containing the Redis configuration parameters.  
This is an example of a minimal configuration, you can discover more about the params here: https://github.com/NodeRedis/node_redis#options-object-properties.

```js
const cache = new Redache({
  host: '127.0.0.1',
  port: '6379',
  password: 'foobar',
  db: 0,
  tls: {} // Enable TLS, for example for DigitalOcean Redis
})
```

## Usage

- [`.set(key, value, ttl)`](#setkey-value-ttl)
- [`.get(key, fallbackValue?, fallbackTtl?)`](#getkey-fallbackvalue-fallbackttl)
- [`.forget(key)`](#forgetkey)

### `.set(key, value, ttl)`
Store a value in Redis. 

`value` can be as well an object or an array; in that case it will be JSON serialized.  
`ttl` can be a human readable string (e.g. `2 days`), a `Date` instance, a `moment` instance or a number (seconds).

```js
// Store a value by human readable TTL
// It expires in 5 hours
await cache.set('key', 'value', '5 hours')

// Store a value by using a Date instance as TTL
// It expires the 1st Jan 2050
await cache.set('key', 'value', new Date(2050, 1, 1))

// Store a value by using a moment instance as TTL
// It expires in 1 month
await cache.set('key', 'value', moment().add(1, 'month'))

// Store a value by using a numeric TTL (seconds)
// It expires in 3600 seconds -> 1 hour
await cache.set('key', 'value', 3600)
```

---

### `.get(key, fallbackValue?, fallbackTtl?)`
Retrieve a value from Redis by its key.  

It will return `null` if not found, an object or array if the value was serialized or, if passed, the desired fallback value.

```js
// Store for 5 hours
await cache.set('key', 'value', '5 hours')

// It return 'value'
const value = await cache.get('key')

// This will be encoded in Redis as '{"foo":"bar"}'
await cache.set('key', { foo: 'bar' }, '5 hours')

// It return { foo: 'bar' }
const value = await cache.get('key')
```

If you set `fallbackValue` along with `fallbackTtl`, if the given key is not found in Redis it will be created with the provided TTL and fallback and returned.  

See the example below to better understand this.

```js
// This returns null
const value = await cache.get('key')

// This returns 'this is my fallback'
const value = await cache.get('key', 'this is my fallback', '1 hour')

// This NOW returns 'this is my fallback', it has been set by the fallback above with a TTL of 3600 (1 hour)
const value = await cache.get('key')
```

The comparison below could also help you to understand it.

```js
// This in one line
const value = await cache.get('key', 'this is my fallback', '1 hour')

// Is the same of
let value = await cache.get('key')
if (key === null) {
  value = 'this is my fallback'
  await cache.set('key', 'this is my fallback', '1 hour')
}

// Pretty simple, isn't it?
```

---

### `.forget(key)`
Remove a stored value from Redis. 

```js
// Store a value for an hour
await cache.set('key', 'value', '1 hour')

// It returns 'value'
const value = await cache.get('key')

// Remove it
await cache.forget('key')

// It returns null
const isItRemoved = await cache.get('key')
```
