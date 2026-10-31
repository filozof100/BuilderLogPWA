export default class Attachment {
  #id = 0;

  #url = null;

  constructor(id, url) {
    this.#id = id;
    this.#url = url;
  }

  getId() {
    return this.#id;
  }

  getUrl() {
    return this.#url;
  }
}
