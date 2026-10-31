import Worker from '../employee/Worker.js';
import TimeUtils from '../utils/TimeUtils.js';

export default class WorkerAttendance {
  #workerAttendanceId = 0;
  #dailyLogId = 0;
  #workerId = 0;
  #startedAt = null;
  #finishedAt = null;
  #advance = null;
  #constructionSiteId = 0;
  #constructionSiteName = null;
  #date = null;
  #worker = null;
  #machineAssignmentId = null;
  #machine = null;

  constructor(...args) {
    if (args.length === 8) {
      const [workerAttendanceId, dailyLogId, workerId, name, lastName, startedAt, finishedAt, advance] = args;
      this.#workerAttendanceId = workerAttendanceId;
      this.#dailyLogId = dailyLogId;
      this.#workerId = workerId;
      this.#worker = new Worker(workerId, name, lastName);
      this.#startedAt = TimeUtils.convertTime(startedAt);
      this.#finishedAt = TimeUtils.convertTime(finishedAt);
      this.#advance = Math.trunc(Number(advance)) * 100 === 0 ? '-' : advance;
    } else if (args.length === 10 || args.length === 12) {
      const [workerAttendanceId, workerId, name, lastName, startedAt, finishedAt, advance, constructionSiteId, constructionSiteName, date] = args;
      this.#workerAttendanceId = workerAttendanceId;
      this.#workerId = workerId;
      this.#worker = new Worker(workerId, name, lastName);
      this.#startedAt = TimeUtils.convertTime(startedAt);
      this.#finishedAt = TimeUtils.convertTime(finishedAt);
      this.#advance = Math.trunc(Number(advance)) * 100 === 0 ? '-' : advance;
      this.#constructionSiteId = constructionSiteId;
      this.#constructionSiteName = constructionSiteName;
      this.#date = date != null && date.length >= 10
        ? date.substring(8, 10) + '.' + date.substring(5, 7) + '.' + date.substring(0, 4) + '.'
        : '';

      if (args.length === 12) {
        this.#machineAssignmentId = args[10];
        this.#machine = args[11];
      }
    } else {
      throw new TypeError('WorkerAttendance expects 8, 10, or 12 arguments');
    }
  }

  getMachine() {
    return this.#machine;
  }

  getWorkerId() {
    return this.#workerId;
  }

  getStartedAt() {
    return this.#startedAt;
  }

  getFinishedAt() {
    return this.#finishedAt;
  }

  getAdvance() {
    return this.#advance;
  }

  getWorkerAttendanceId() {
    return this.#workerAttendanceId;
  }

  getConstructionSiteId() {
    return this.#constructionSiteId;
  }

  getConstructionSiteName() {
    return this.#constructionSiteName;
  }

  getDate() {
    return this.#date;
  }

  getWorker() {
    return this.#worker;
  }
}
