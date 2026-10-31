export default class Supplier {
  #id = 0;
  #name = null;
  #isActive = false;

  constructor(id, name, isActive) {
    this.#id = id;
    this.#name = name;
    this.#isActive = isActive;
  }

  getId() {
    return this.#id;
  }

  getName() {
    return this.#name;
  }

  isActive() {
    return this.#isActive;
  }
}
