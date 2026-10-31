export default class ExcavatorLog {
  #excavatorLogId = 0;
  #machineAssignmentId = null;
  #constructionSiteId = 0;
  #operatorId = 0;
  #constructionSiteName = null;
  #excavator = null;
  #operatorStartedAt = null;
  #operatorFinishedAt = null;
  #managerStartedAt = null;
  #managerFinishedAt = null;
  #startHours = null;
  #endHours = null;
  #operatorNote = null;
  #managerNote = null;
  #date = null;
  #operatorName = null;

  /**
   * Java constructor overloads, in source order:
   * (logId, operatorId, siteId, excavator, managerStart, managerFinish, managerNote, assignmentId)
   * (logId, operatorId, siteId, excavator, managerStart, managerFinish, managerNote)
   * (logId, operatorId, siteId, excavator, operatorStart, operatorFinish, startHours, endHours, siteName, note)
   * (logId, operatorId, siteId, operatorStart, operatorFinish, managerStart, managerFinish, siteName, date)
   * (logId, startHours, endHours, date, managerNote, operatorName, siteName)
   *
   * The two seven-argument overloads differ by argument 2:
   * numeric operatorId versus string (or null) startHours.
   */
  constructor(...args) {
    if (args.length === 8 || (args.length === 7 && typeof args[1] === 'number')) {
      const [logId, operatorId, siteId, excavator, managerStart, managerFinish, managerNote] = args;
      this.#excavatorLogId = logId;
      this.#operatorId = operatorId;
      this.#constructionSiteId = siteId;
      this.#excavator = excavator;
      this.#managerStartedAt = managerStart == null ? '' : managerStart;
      this.#managerFinishedAt = managerFinish == null ? '' : managerFinish;
      this.#managerNote = managerNote == null ? '' : managerNote;
      if (args.length === 8) {
        this.#machineAssignmentId = args[7];
      }
    } else if (args.length === 10) {
      const [logId, operatorId, siteId, excavator, operatorStart, operatorFinish, startHours, endHours, siteName, note] = args;
      this.#excavatorLogId = logId;
      this.#operatorId = operatorId;
      this.#constructionSiteId = siteId;
      this.#excavator = excavator;
      this.#operatorStartedAt = operatorStart;
      this.#operatorFinishedAt = operatorFinish;
      this.#startHours = startHours;
      this.#endHours = endHours;
      this.#constructionSiteName = siteName;
      this.#operatorNote = note;
    } else if (args.length === 9) {
      const [logId, operatorId, siteId, operatorStart, operatorFinish, managerStart, managerFinish, siteName, date] = args;
      this.#excavatorLogId = logId;
      this.#operatorId = operatorId;
      this.#constructionSiteId = siteId;
      this.#operatorStartedAt = operatorStart;
      this.#operatorFinishedAt = operatorFinish;
      this.#managerStartedAt = managerStart;
      this.#managerFinishedAt = managerFinish;
      this.#constructionSiteName = siteName;
      this.#date = date != null && date.length >= 10
        ? date.substring(8, 10) + '.' + date.substring(5, 7) + '.' + date.substring(0, 4) + '.'
        : '';
    } else if (args.length === 7 && (typeof args[1] === 'string' || args[1] === null)) {
      const [logId, startHours, endHours, date, managerNote, operatorName, siteName] = args;
      this.#excavatorLogId = logId;
      this.#startHours = startHours;
      this.#endHours = endHours;
      this.#date = date != null && date.length >= 10
        ? date.substring(8, 10) + '.' + date.substring(5, 7) + '.' + date.substring(0, 4) + '.'
        : '';
      this.#managerNote = managerNote;
      this.#operatorName = operatorName;
      this.#constructionSiteName = siteName;
    } else {
      throw new TypeError('Arguments do not match an ExcavatorLog constructor');
    }
  }

  getExcavatorLogId() {
    return this.#excavatorLogId;
  }

  getConstructionSiteId() {
    return this.#constructionSiteId;
  }

  getOperatorId() {
    return this.#operatorId;
  }

  getExcavator() {
    return this.#excavator;
  }

  getOperatorStartedAt() {
    return this.#operatorStartedAt;
  }

  getOperatorFinishedAt() {
    return this.#operatorFinishedAt;
  }

  getOperatorNote() {
    return this.#operatorNote;
  }

  getManagerNote() {
    return this.#managerNote;
  }

  getConstructionSiteName() {
    return this.#constructionSiteName;
  }

  getManagerStartedAt() {
    return this.#managerStartedAt;
  }

  getManagerFinishedAt() {
    return this.#managerFinishedAt;
  }

  getStartHours() {
    return this.#startHours;
  }

  getEndHours() {
    return this.#endHours;
  }

  getDate() {
    return this.#date;
  }

  getOperatorName() {
    return this.#operatorName;
  }

  getMachineAssignmentId() {
    return this.#machineAssignmentId;
  }
}
