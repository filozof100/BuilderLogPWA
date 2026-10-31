export default class WorkerSalary {
  #amount = 0;
  #worker = null;

  constructor(amount, worker) {
    this.#amount = Math.trunc(Number(amount));
    this.#worker = worker;
  }

  getAmount() {
    return this.#amount;
  }

  getWorker() {
    return this.#worker;
  }
}
