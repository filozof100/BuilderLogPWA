import TimeUtils from '../utils/TimeUtils.js';

export default class MachineAttendance {
  #excavatorLogId = 0;
  #dailyLogId = 0;
  #machineId = 0;
  #startedAt = null;
  #finishedAt = null;

  constructor(excavatorLogId, dailyLogId, machineId, startedAt, finishedAt) {
    this.#excavatorLogId = excavatorLogId;
    this.#dailyLogId = dailyLogId;
    this.#machineId = machineId;
    this.#startedAt = TimeUtils.convertTime(startedAt);
    this.#finishedAt = TimeUtils.convertTime(finishedAt);
  }

  getExcavatorLogId() {
    return this.#excavatorLogId;
  }

  getStartedAt() {
    return this.#startedAt;
  }

  getFinishedAt() {
    return this.#finishedAt;
  }
}
