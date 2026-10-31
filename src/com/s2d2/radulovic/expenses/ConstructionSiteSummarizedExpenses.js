export default class ConstructionSiteSummarizedExpenses {
  #workerSalaries = 0;
  #managerExpenses = 0;
  #adminExpenses = 0;

  constructor(workerSalaries, managerExpenses, adminExpenses) {
    this.#workerSalaries = workerSalaries;
    this.#managerExpenses = managerExpenses;
    this.#adminExpenses = adminExpenses;
  }

  getWorkerSalaries() {
    return this.#workerSalaries;
  }

  getManagerExpenses() {
    return this.#managerExpenses;
  }

  getAdminExpenses() {
    return this.#adminExpenses;
  }
}
