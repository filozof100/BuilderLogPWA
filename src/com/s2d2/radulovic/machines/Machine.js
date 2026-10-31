export default class Machine {
  #machineId = 0;
  #name = null;
  #type = null;
  #licensePlate = null;
  #status = null;

  #attendances = null;

  constructor(machineId, name, type, licensePlate, status) {
    this.#machineId = machineId;
    this.#name = name;
    this.#type = type;
    this.#licensePlate = licensePlate == null ? '' : licensePlate;
    this.#status = status;
    this.#attendances = new Map();
  }

  getMachineId() {
    return this.#machineId;
  }

  getName() {
    return this.#name;
  }

  getLicensePlate() {
    return this.#licensePlate;
  }

  setAttendance(dailyLogId, attendance) {
    this.#attendances.set(dailyLogId, attendance);
  }

  removeAttendance(dailyLogId) {
    this.#attendances.delete(dailyLogId);
  }

  getType() {
    return this.#type;
  }

  getStatus() {
    return this.#status;
  }
}
