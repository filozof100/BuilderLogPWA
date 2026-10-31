export default class ExpensesSummary {
  #advanced = 0;
  #spent = 0;
  #remaining = 0;
  #listOfAdvances;

  constructor(advanced, spent, remaining) {
    this.#advanced = Math.trunc(Number(advanced));
    this.#spent = Math.trunc(Number(spent));
    this.#remaining = Math.trunc(Number(remaining));
    this.#listOfAdvances = [];
  }

  getSpent() {
    return this.#spent;
  }

  getAdvanced() {
    return this.#advanced;
  }

  getRemaining() {
    return this.#remaining;
  }

  addAdvance(date, amount) {
    date = date.length >= 10
      ? date.substring(8, 10) + '.' + date.substring(5, 7) + '.' + date.substring(0, 4) + '.'
      : '';
    this.#listOfAdvances.push(Object.freeze({ first: date, second: amount }));
  }

  getListOfAdvances() {
    return this.#listOfAdvances;
  }
}
