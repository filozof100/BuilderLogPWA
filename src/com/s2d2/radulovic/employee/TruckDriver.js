import Worker from './Worker.js';

export default class TruckDriver extends Worker {
  #available = false;

  #hourlyRate = 0;

  constructor(id, firstName, lastName, role, available, isActive, username, email, phoneNumber, hourlyRate) {
    super(id, firstName, lastName, role, isActive, username, email, phoneNumber);
    this.#available = available;
    this.#hourlyRate = Math.trunc(Number(hourlyRate));
  }

  getHourlyRate() {
    return this.#hourlyRate;
  }
}
