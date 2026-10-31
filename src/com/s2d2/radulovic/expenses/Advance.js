export default class Advance {
  #id = 0;
  #date = null;
  #amount = 0;
  #workerName = null;

  constructor(id, date, amount, workerName) {
    if (arguments.length !== 3 && arguments.length !== 4) {
      throw new TypeError('Advance expects 3 or 4 arguments');
    }
    this.#id = id;
    this.#date = date != null && date.length >= 10
      ? date.substring(8, 10) + '.' + date.substring(5, 7) + '.' + date.substring(0, 4) + '.'
      : '';
    this.#amount = Number(amount);
    if (arguments.length === 4) {
      this.#workerName = workerName;
    }
  }

  getId() {
    return this.#id;
  }

  getAmount() {
    return this.#amount;
  }

  getDate() {
    return this.#date;
  }

  getWorkerName() {
    return this.#workerName;
  }
}
