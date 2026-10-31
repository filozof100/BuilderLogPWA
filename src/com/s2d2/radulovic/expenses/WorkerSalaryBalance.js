export default class WorkerSalaryBalance {
  #earned;
  #advances;
  #payments;
  #outstanding;
  #estimatedHours;
  #estimatedAttendances;
  #missingHourlyRates;
  #missingHourlyRateAttendances;

  constructor(earned, advances, payments, outstanding, estimatedHours, estimatedAttendances, missingHourlyRates, missingHourlyRateAttendances) {
    this.#earned = WorkerSalaryBalance.#parseAmount(earned);
    this.#advances = WorkerSalaryBalance.#parseAmount(advances);
    this.#payments = WorkerSalaryBalance.#parseAmount(payments);
    this.#outstanding = WorkerSalaryBalance.#parseAmount(outstanding);
    this.#estimatedHours = estimatedHours;
    this.#estimatedAttendances = estimatedAttendances;
    this.#missingHourlyRates = missingHourlyRates;
    this.#missingHourlyRateAttendances = missingHourlyRateAttendances;
  }

  getEarned() {
    return this.#earned;
  }

  getAdvances() {
    return this.#advances;
  }

  getPayments() {
    return this.#payments;
  }

  getOutstanding() {
    return this.#outstanding;
  }

  hasEstimatedHours() {
    return this.#estimatedHours;
  }

  getEstimatedAttendances() {
    return this.#estimatedAttendances;
  }

  hasMissingHourlyRates() {
    return this.#missingHourlyRates;
  }

  getMissingHourlyRateAttendances() {
    return this.#missingHourlyRateAttendances;
  }
  static #parseAmount(value) {
    if (typeof value !== 'string' || !/^[+-]?\d+(?:\.\d+)?$/.test(value)) {
      throw new TypeError('Invalid amount: ' + value);
    }
    // Discard the fractional part toward zero, as Android does.
    return BigInt(value.split('.')[0]);
  }
}
