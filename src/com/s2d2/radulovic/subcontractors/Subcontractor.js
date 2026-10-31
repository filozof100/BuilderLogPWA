export default class Subcontractor {
  static #serialVersionUID = 1;

  #subcontractorId = 0;

  #name = null;

  #isActive = false;

  #phoneNumber = null;

  #email = null;

  #attendances = null;

  constructor(subcontractorId, name, isActive, phoneNumber, email) {
    this.#subcontractorId = subcontractorId;
    this.#name = name;
    this.#isActive = isActive;
    this.#phoneNumber = phoneNumber == null ? '' : phoneNumber;
    this.#attendances = new Map();
    this.#email = email;
  }

  getSubcontractorId() {
    return this.#subcontractorId;
  }

  getName() {
    return this.#name;
  }

  isActive() {
    return this.#isActive;
  }

  getPhoneNumber() {
    return this.#phoneNumber;
  }

  setAttendance(dailyLogId, attendance) {
    this.#attendances.set(dailyLogId, attendance);
  }

  getAttendance(dailyLogId) {
    return this.#attendances.get(dailyLogId) ?? null;
  }

  removeAttendance(dailyLogId) {
    this.#attendances.delete(dailyLogId);
  }
}
