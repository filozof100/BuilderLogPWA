import Worker from './Worker.js';

export default class Operator extends Worker {
  #available = false;

  #hourlyRate = 0;

  constructor(id, firstName, lastName, role, available, isActive, username, email, phoneNumber, hourlyrate) {
    super(id, firstName, lastName, role, isActive, username, email, phoneNumber);
    this.#available = available;
    this.#hourlyRate = Math.trunc(Number(hourlyrate));
  }

  getHourlyRate() {
    return this.#hourlyRate;
  }
}
