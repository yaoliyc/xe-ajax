import { XEAjax } from './constructor'
import { XEPromise } from './promise'
import { isObject } from './util'

function createAjax (method, def, opts) {
  return new XEAjax(Object.assign({method: method}, def, opts))
}

// xhr response JSON
function responseJSON (method) {
  return function () {
    return XEAjax[method].apply(this, arguments).then(function (response) {
      return response.body
    }).catch(function (response) {
      return XEPromise.reject(response.body, this)
    })
  }
}

// Http Request Batch
export function all (iterable, context) {
  return XEPromise.all(iterable, context || XEAjax.context)
}

// Http Request Method get
export function get (url, params, opts) {
  return createAjax('get', isObject(url) ? {} : {url: url, params: params}, opts)
}

// Http Request Method post
export function post (url, body, opts) {
  return createAjax('post', isObject(url) ? {} : {url: url, body: body}, opts)
}

// Http Request Method put
export function put (url, body, opts) {
  return createAjax('put', isObject(url) ? {} : {url: url, body: body}, opts)
}

// Http Request Method patch
export function patch (url, body, opts) {
  return createAjax('patch', isObject(url) ? {} : {url: url, body: body}, opts)
}

// Http Request Method delete
export function del (url, body, opts) {
  return createAjax('delete', isObject(url) ? {} : {url: url, body: body}, opts)
}

// Http Request Method jsonp
var jsonpIndex = 0
export function jsonp (url, params, opts) {
  return createAjax('get', {url: url, params: params, jsonp: 'callback', jsonpCallback: 'XEAjax_JSONP_' + (++jsonpIndex)}, opts)
}

// export default {
//   all,
//   get,
//   getJSON: responseJSON('get'),
//   post,
//   postJSON: responseJSON('post'),
//   put,
//   putJSON: responseJSON('put'),
//   patch,
//   patchJSON: responseJSON('patch'),
//   del,
//   delJSON: responseJSON('delete'),
//   jsonp
// }
