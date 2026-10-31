export default class Document {
  #id = 0;
  #name = null;
  #type = null;
  #date = null;
  #time = null;
  #description = null;
  #url = null;

  constructor(id, name, type, date, url, description = '') {
    if (arguments.length !== 5 && arguments.length !== 6) {
      throw new TypeError('Document expects 5 or 6 arguments');
    }

    this.#id = id;
    this.#name = name;
    this.#type = type;
    this.#date = date != null && date.length >= 10
      ? date.substring(8, 10) + '.' + date.substring(5, 7) + '.' + date.substring(0, 4) + '.'
      : '';
    this.#time = date != null && date.length >= 19 ? date.substring(11, 19) : '';
    this.#url = url;
    this.#description = description;
  }

  getId() {
    return this.#id;
  }

  getDate() {
    return this.#date;
  }

  getTime() {
    return this.#time;
  }

  getName() {
    return this.#name;
  }

  getType() {
    return this.#type;
  }

  getUrl() {
    return this.#url;
  }

  getDescription() {
    return this.#description;
  }
}
