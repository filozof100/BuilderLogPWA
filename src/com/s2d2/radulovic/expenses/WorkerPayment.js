export default class WorkerPayment {
  #id = 0;
  #date = null;
  #amount = 0;
  #note = null;

  constructor(id, amount, date, note) {
    this.#id = id;
    this.#amount = Math.trunc(Number(amount));
    this.#date = date != null && date.length >= 10
      ? date.substring(8, 10) + '.' + date.substring(5, 7) + '.' + date.substring(0, 4) + '.'
      : '';
    this.#note = note;
  }

  getId() {
    return this.#id;
  }

  getDate() {
    return this.#date;
  }

  getAmount() {
    return this.#amount;
  }

  getNote() {
    return this.#note;
  }
}
