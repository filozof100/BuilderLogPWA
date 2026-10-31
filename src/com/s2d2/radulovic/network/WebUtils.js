import NetworkLoadingState from '../NetworkLoadingState.js';

// Port of Android WebUtils.java at cda0929. Method groups follow the Java order.
// Java overloads share a dispatcher; callbacks remain the public result contract.
// Returned promises settle after callbacks and loading bookkeeping complete.
export default class WebUtils {
  static #CLIENT = request => globalThis.fetch(request);
  static #JSON = 'application/json; charset=utf-8';

  static get BASE_URL() {
    return 'https://builderlog.s2d2.rs/api/v1/';
  }

  constructor() {
    throw new TypeError('WebUtils is a static utility class');
  }

  /**
   * Java ResponseCallback interface.
   * @typedef {Object} ResponseCallback
   * @property {(responseBody: string) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * Java DownloadCallback interface. Browser File replaces java.io.File.
   * @typedef {Object} DownloadCallback
   * @property {(file: File) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * sendGETRequest(endpoint, queryParameters, headers, callback)
   * Query/header maps accept either a JavaScript Map or a plain object.
   */
  static sendGETRequest(endpoint, queryParameters, headers, callback) {
    let baseUrl;
    try {
      baseUrl = new URL(WebUtils.BASE_URL + endpoint);
      if (!['http:', 'https:'].includes(baseUrl.protocol)) throw new TypeError();
    } catch {
      callback.onFailure(new TypeError('Invalid URL'));
      return;
    }

    const parameters = typeof queryParameters.entries === 'function'
      ? queryParameters.entries()
      : Object.entries(queryParameters);
    for (const [key, value] of parameters) {
      baseUrl.searchParams.append(key, value);
    }

    const requestBuilder = {
      url: baseUrl.href,
      method: 'GET',
      headers: new Headers(),
    };
    WebUtils.#addHeaders(requestBuilder, headers);
    return WebUtils.#executeRequest(requestBuilder, callback);
  }

  /**
   * Java overloads, in source order:
   * sendPOSTRequest(endpoint, jsonBody, callback)
   * sendPOSTRequest(endpoint, jsonBody, headers, callback)
   * sendPOSTRequest(endpoint, requestBody, headers, callback)
   *
   * JSON strings become UTF-8 JSON bodies. FormData and Blob replace
   * OkHttp RequestBody for multipart and binary uploads.
   */
  static sendPOSTRequest(endpoint, jsonBodyOrRequestBody, headersOrCallback, callback) {
    const headers = arguments.length === 3 ? {} : headersOrCallback;
    if (arguments.length === 3) callback = headersOrCallback;

    const requestBody = typeof jsonBodyOrRequestBody === 'string'
      ? new Blob([jsonBodyOrRequestBody], { type: WebUtils.#JSON })
      : jsonBodyOrRequestBody;
    const requestBuilder = {
      url: WebUtils.BASE_URL + endpoint,
      method: 'POST',
      body: requestBody,
      headers: new Headers(),
    };
    WebUtils.#addHeaders(requestBuilder, headers);
    return WebUtils.#executeRequest(requestBuilder, callback);
  }

  /**
   * sendPATCHRequest(endpoint, jsonBody, headers, callback)
   * sendPATCHRequest(endpoint, requestBody, headers, callback)
   */
  static sendPATCHRequest(endpoint, jsonBodyOrRequestBody, headers, callback) {
    const requestBody = typeof jsonBodyOrRequestBody === 'string'
      ? new Blob([jsonBodyOrRequestBody], { type: WebUtils.#JSON })
      : jsonBodyOrRequestBody;
    const requestBuilder = {
      url: WebUtils.BASE_URL + endpoint,
      method: 'PATCH',
      body: requestBody,
      headers: new Headers(),
    };
    WebUtils.#addHeaders(requestBuilder, headers);
    return WebUtils.#executeRequest(requestBuilder, callback);
  }

  /**
   * sendDELETERequest(endpoint, headers, callback)
   * sendDELETERequest(endpoint, jsonBody, headers, callback)
   */
  static sendDELETERequest(endpoint, jsonBodyOrHeaders, headersOrCallback, callback) {
    const hasBody = arguments.length === 4;
    const headers = hasBody ? headersOrCallback : jsonBodyOrHeaders;
    if (!hasBody) callback = headersOrCallback;

    const requestBuilder = {
      url: WebUtils.BASE_URL + endpoint,
      method: 'DELETE',
      headers: new Headers(),
    };
    if (hasBody) {
      requestBuilder.body = new Blob([jsonBodyOrHeaders], { type: WebUtils.#JSON });
    }
    WebUtils.#addHeaders(requestBuilder, headers);
    return WebUtils.#executeRequest(requestBuilder, callback);
  }

  /**
   * downloadFile(downloadUrl, destinationFile, headers, callback)
   *
   * destinationFile is a File or filename string. Browsers cannot create
   * arbitrary device directories or overwrite a supplied File. onSuccess
   * receives a NEW in-memory File with the destination name and downloaded
   * bytes, for later preview/save/share by the screen. No automatic save dialog.
   * Failed/partial downloads are discarded without returning a File.
   */
  static async downloadFile(downloadUrl, destinationFile, headers, callback) {
    const resolvedUrl = downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')
      ? downloadUrl
      : WebUtils.BASE_URL + (downloadUrl.startsWith('/') ? downloadUrl.substring(1) : downloadUrl);

    let parsedUrl;
    try {
      parsedUrl = new URL(resolvedUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new TypeError();
    } catch {
      callback.onFailure(new TypeError('Invalid download URL'));
      return;
    }

    const requestBuilder = {
      url: parsedUrl.href,
      method: 'GET',
      headers: new Headers(),
    };
    WebUtils.#addHeaders(requestBuilder, headers);
    NetworkLoadingState.requestStarted();

    try {
      let file;
      try {
        const { url, ...options } = requestBuilder;
        const request = new Request(url, { ...options, credentials: 'omit' });
        const response = await WebUtils.#CLIENT(request);

        if (!response.ok) {
          const errorBody = response.body === null ? '' : await response.text();
          throw new WebUtils.HttpException(response.status, errorBody);
        }
        if (response.body === null) throw new Error('Empty download response');

        const blob = await response.blob();
        const name = typeof destinationFile === 'string'
          ? destinationFile.split(/[\\/]/).pop()
          : destinationFile.name;
        if (!name) throw new TypeError('Missing destination filename');
        file = new File([blob], name, { type: blob.type });
      } catch (exception) {
        callback.onFailure(exception);
        return;
      }
      // Keep consumer callback errors separate from transport failures.
      callback.onSuccess(file);
    } finally {
      NetworkLoadingState.requestFinished();
    }
  }

  static #addHeaders(requestBuilder, headers) {
    const entries = typeof headers.entries === 'function'
      ? headers.entries()
      : Object.entries(headers);
    for (const [key, value] of entries) {
      requestBuilder.headers.append(key, value);
    }
  }

  static async #executeRequest(request, callback) {
    NetworkLoadingState.requestStarted();

    try {
      let response;
      let body;
      try {
        const { url, ...options } = request;
        // Like OkHttp's body handling, the body determines its Content-Type.
        // Fetch must generate the multipart boundary itself.
        if (options.body instanceof FormData) {
          options.headers.delete('Content-Type');
        } else if (options.body instanceof Blob && options.body.type) {
          options.headers.set('Content-Type', options.body.type);
        }
        response = await WebUtils.#CLIENT(
          new Request(url, { ...options, credentials: 'omit' }),
        );
        body = response.body === null ? '' : await response.text();
      } catch (exception) {
        callback.onFailure(exception);
        return;
      }

      if (!response.ok) {
        console.error('AdminEditMachine', 'HTTP ' + response.status);
        callback.onFailure(new WebUtils.HttpException(response.status, body));
        return;
      }
      callback.onSuccess(body);
    } finally {
      NetworkLoadingState.requestFinished();
    }
  }

  static HttpException = class HttpException extends Error {
    #statusCode;
    #responseBody;

    constructor(statusCode, responseBody) {
      super('HTTP request failed with status ' + statusCode);
      this.name = 'HttpException';
      this.#statusCode = statusCode;
      this.#responseBody = responseBody;
    }

    getStatusCode() {
      return this.#statusCode;
    }

    getResponseBody() {
      return this.#responseBody;
    }
  };
}
