export default class DailyLog {
  #dailyLogId = 0;
  #constructionSiteId = 0;
  #managerId = 0;
  #dailyLogDate = null;

  constructor(dailyLogId, constructionSiteId, managerId, dailyLogDate) {
    this.#dailyLogId = dailyLogId;
    this.#constructionSiteId = constructionSiteId;
    this.#managerId = managerId;
    this.#dailyLogDate = dailyLogDate;
  }

  toString() {
    return 'daily log id: ' + this.#dailyLogId + ' construction site id: ' + this.#constructionSiteId + ' manager id: ' + this.#managerId + ' date: ' + this.#dailyLogDate;
  }

  getDailyLogId() {
    return this.#dailyLogId;
  }

  getDailyLogDate() {
    return this.#dailyLogDate;
  }

  getConstructionSiteId() {
    return this.#constructionSiteId;
  }
}
