'use strict'

var utils = require('../core/utils')
var handleExports = require('../handle')

var reqQueue = { resolves: [], rejects: [] }
var respQueue = { resolves: [], rejects: [] }

function addCheckQueue (calls, callback) {
  if (!utils.includes(calls, callback)) {
    calls.push(callback)
  }
}

function useInterceptors (queue) {
  return function (finish, failed) {
    if (finish) {
      addCheckQueue(queue.resolves, finish)
    }
    if (failed) {
      addCheckQueue(queue.rejects, failed)
    }
  }
}

/**
 * Request 拦截器
 */
function requests (request) {
  var thenInterceptor = Promise.resolve(request)
  utils.arrayEach(reqQueue.resolves, function (callback) {
    thenInterceptor = thenInterceptor.then(function (req) {
      return new Promise(function (resolve) {
        callback(req, function () {
          resolve(req)
        })
      })
    })['catch'](utils.err)
  })
  return thenInterceptor
}

/**
 * Response 拦截器
 */
function responseInterceptor (calls, request, response) {
  var thenInterceptor = Promise.resolve(response)
  utils.arrayEach(calls, function (callback) {
    thenInterceptor = thenInterceptor.then(function (response) {
      return new Promise(function (resolve) {
        callback(response, function (resp) {
          resolve(resp && resp.body && resp.status ? handleExports.toResponse(resp, request) : response)
        }, request)
      })
    })['catch'](utils.err)
  })
  return thenInterceptor
}

var interceptors = {
  request: {
    use: useInterceptors(reqQueue)
  },
  response: {
    use: useInterceptors(respQueue)
  }
}

// 默认拦截器
interceptors.request.use(function (request, next) {
  var reqHeaders = request.headers
  var reqBody = request.body
  var reqMethod = request.method
  if (reqBody && reqMethod !== 'GET' && reqMethod !== 'HEAD') {
    if (!utils.isFData(reqBody)) {
      reqHeaders.set('Content-Type', utils.isURLSParams(reqBody) || request.bodyType === 'form-data' ? 'application/x-www-form-urlencoded' : 'application/json; charset=utf-8')
    }
  }
  if (utils.isCrossOrigin(request.getUrl())) {
    reqHeaders.set('X-Requested-With', 'XMLHttpRequest')
  }
  next()
})

function responseToResolves (request, response, resolve, reject) {
  responseInterceptor(respQueue.resolves, request, response).then(resolve)
}

function responseToRejects (request, response, resolve, reject) {
  responseInterceptor(respQueue.rejects, request, response).then(function (e) {
    (handleExports.isResponse(e) ? resolve : reject)(e)
  })
}

var interceptorExports = {
  interceptors: interceptors,
  requests: requests,
  toResolves: responseToResolves,
  toRejects: responseToRejects
}

module.exports = interceptorExports
