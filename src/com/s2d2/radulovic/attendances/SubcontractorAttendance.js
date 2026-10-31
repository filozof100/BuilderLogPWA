import TimeUtils from '../utils/TimeUtils.js';

export default class SubcontractorAttendance {
  static #serialVersionUID = 1;
  #subcontractorAttendanceId = 0;
  #dailyLogId = 0;
  #subcontractorId = 0;
  #startedAt = null;
  #finishedAt = null;
  #numberOfWorkers = 0;
  #note = null;
  #date = null;
  #constructionSite = null;
  #managerName = null;

  constructor(...args) {
    switch (args.length) {
      case 7: {
        const [subcontractorAttendanceId, dailyLogId, subcontractorId, startedAt, finishedAt, numberOfWorkers, note] = args;
        this.#subcontractorAttendanceId = subcontractorAttendanceId;
        this.#dailyLogId = dailyLogId;
        this.#subcontractorId = subcontractorId;
        this.#startedAt = TimeUtils.convertTime(startedAt);
        this.#finishedAt = TimeUtils.convertTime(finishedAt);
        this.#numberOfWorkers = numberOfWorkers;
        this.#note = note == null || note === 'null' ? '' : note;
        break;
      }
      case 9: {
        const [subcontractorAttendanceId, subcontractorId, startedAt, finishedAt, numberOfWorkers, note, date, constructionSite, managerName] = args;
        this.#subcontractorAttendanceId = subcontractorAttendanceId;
        this.#subcontractorId = subcontractorId;
        this.#startedAt = TimeUtils.convertTime(startedAt);
        this.#finishedAt = TimeUtils.convertTime(finishedAt);
        this.#numberOfWorkers = numberOfWorkers;
        this.#note = note == null || note === 'null' ? '' : note;
        this.#date = date;
        this.#constructionSite = constructionSite;
        this.#managerName = managerName;
        break;
      }
      default:
        throw new TypeError('SubcontractorAttendance expects 7 or 9 arguments');
    }
  }

  getSubcontractorId() {
    return this.#subcontractorId;
  }

  getStartedAt() {
    return this.#startedAt;
  }

  getFinishedAt() {
    return this.#finishedAt;
  }

  getNumberOfWorkers() {
    return this.#numberOfWorkers;
  }

  getSubcontractorAttendanceId() {
    return this.#subcontractorAttendanceId;
  }

  getNote() {
    return this.#note;
  }

  getDate() {
    return this.#date;
  }

  getConstructionSite() {
    return this.#constructionSite;
  }

  getManagerName() {
    return this.#managerName;
  }
}
