import XEAjaxRequest from './request'
import XEAjaxResponse from './response'
import { requestInterceptor, responseInterceptor } from './interceptor'
import { isFunction, eachObj, objectAssign } from './util'

var global = typeof window === 'undefined' ? this : window
var setupDefaults = {
  method: 'GET',
  baseURL: location.origin,
  async: true,
  credentials: true,
  bodyType: 'JSON_DATA',
  headers: {
    Accept: 'application/json, text/plain, */*;'
  },
  getXMLHttpRequest: function () {
    return new XMLHttpRequest()
  },
  getPromiseStatus: function (response) {
    return (response.status >= 200 && response.status < 300) || response.status === 304
  }
}

/**
  * XHR AJAX
  *
  * @param Object options 请求参数
  * @return Promise
  */
export function XEAjax (options) {
  return new Promise(function (resolve, reject) {
    return (options && options.jsonp ? sendJSONP : sendXHR)(new XEAjaxRequest(objectAssign({}, setupDefaults, {headers: objectAssign({}, setupDefaults.headers)}, options)), resolve, reject)
  })
}

/**
 * 响应结束
 * @param { XEAjaxRequest } request 对象
 * @param { XHR } xhr 请求
 * @param { Promise.resolve } resolve 成功
 * @param { Promise.reject } reject 失败
 */
function sendEnd (request, xhr, resolve, reject) {
  responseInterceptor(new XEAjaxResponse(request, xhr)).then(function (response) {
    resolve(response)
  })
}

/**
 * XHR 请求处理
 * @param { XHR } xhr 请求
 * @param { Promise.resolve } resolve 成功 Promise
 * @param { Promise.reject } reject 失败 Promise
 */
function sendXHR (request, resolve, reject) {
  var xhr = request.xhr
  requestInterceptor(request).then(function () {
    xhr.open(request.method, request.getUrl(), request.async !== false)
    if (request.timeout && !isNaN(request.timeout)) {
      xhr.timeout = request.timeout
    }
    eachObj(request.headers, function (value, name) {
      xhr.setRequestHeader(name, value)
    })
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        sendEnd(request, xhr, resolve, reject)
      }
    }
    if (request.credentials === 'include') {
      xhr.withCredentials = true
    } else if (request.credentials === 'omit') {
      xhr.withCredentials = false
    }
    request.getBody().then(function (body) {
      xhr.send(body)
    }).catch(function () {
      xhr.send()
    })
  })
}

/**
 * jsonp 请求处理
 */
var jsonpIndex = 0
function sendJSONP (request, resolve, reject) {
  var script = request.script
  var url = request.getUrl()
  if (!request.jsonpCallback) {
    request.jsonpCallback = '_xeajax_jsonp' + (++jsonpIndex)
  }
  global[request.jsonpCallback] = function (response) {
    jsonpHandle(request, {status: 200, response: response}, resolve, reject)
  }
  script.type = 'text/javascript'
  script.src = url + (url.indexOf('?') === -1 ? '?' : '&') + request.jsonp + '=' + request.jsonpCallback
  script.onerror = function (evnt) {
    jsonpHandle(request, {status: 500, response: null}, resolve, reject)
  }
  if (isFunction(request.sendJSONP)) {
    request.sendJSONP(script, request, resolve, reject)
  } else {
    document.body.appendChild(script)
  }
}

/**
 * jsonp 请求结果处理
 * @param { XEAjaxRequest } request 对象
 * @param { XHR } xhr 请求
 * @param { resolve } resolve 成功 Promise
 * @param { reject } reject 失败 Promise
 */
function jsonpHandle (request, xhr, resolve, reject) {
  var response = new XEAjaxResponse(request, xhr)
  delete global[request.jsonpCallback]
  if (isFunction(request.sendEndJSONP)) {
    request.sendEndJSONP(request.script, request)
  } else {
    document.body.removeChild(request.script)
  }
  response.json().then(function (data) {
    (response.ok ? resolve : reject)(data)
  }).catch(function (data) {
    reject(data)
  })
}

/**
 * Request 对象
 *
 * @param String url 请求地址
 * @param String baseURL 基础路径
 * @param String method 请求方法(默认GET)
 * @param Object params 请求参数
 * @param Object body 提交参数
 * @param String bodyType 提交参数方式(默认JSON_DATA) 支持[JSON_DATA:以json data方式提交数据] [FROM_DATA:以form data方式提交数据]
 * @param String jsonp 调用jsonp服务,回调属性默认callback
 * @param Boolean async 异步/同步(默认true)
 * @param String credentials 设置 cookie 是否随请求一起发送,可以设置: omit,same-origin,include(默认same-origin)
 * @param Number timeout 设置超时
 * @param Object headers 请求头
 * @param Function transformParams(request) 用于改变URL参数
 * @param Function paramsSerializer(request) 自定义URL序列化函数
 * @param Function transformBody(request) 用于改变提交数据
 * @param Function stringifyBody(request) 自定义转换提交数据的函数
 */
export var setup = function setup (options) {
  objectAssign(setupDefaults, options)
}

export default XEAjax