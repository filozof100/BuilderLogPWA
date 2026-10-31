import Worker from './Worker.js';

export default class PlainWorker extends Worker {
  #availableToday = false;

  #attendances = null;

  #hourlyRate = 0;

  constructor(id, firstName, lastName, role, availableToday, isActive, username, email, phoneNumber, hourlyRate) {
    super(id, firstName, lastName, role, isActive, username, email, phoneNumber);
    this.#availableToday = availableToday;
    this.#attendances = new Map();
    this.#hourlyRate = Math.trunc(Number(hourlyRate));
  }

  isAvailableToday() {
    return this.#availableToday;
  }

  setAvailableToday(availableToday) {
    this.#availableToday = availableToday;
  }

  setAttendance(dailyLogId, workerAttendance) {
    this.#attendances.set(dailyLogId, workerAttendance);
  }

  getAttendance(dailyLogId) {
    return this.#attendances.get(dailyLogId) ?? null;
  }

  removeAttendance(dailyLogId) {
    this.#attendances.delete(dailyLogId);
  }

  getHourlyRate() {
    return this.#hourlyRate;
  }
}
