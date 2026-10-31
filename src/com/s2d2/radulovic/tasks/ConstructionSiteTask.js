import Task from './Task.js';

export default class ConstructionSiteTask extends Task {
  #constructionSiteId = 0;

  #completedBy = null;

  constructor(id, title, description, dateCreated, isNotificationVisited, isCompleted, constructionSiteId, managerCompletedBy, completedDate) {
    super(id, title, description, dateCreated, isNotificationVisited, isCompleted, completedDate);
    this.#constructionSiteId = constructionSiteId;
    this.#completedBy = managerCompletedBy;
  }

  getConstructionSiteId() {
    return this.#constructionSiteId;
  }

  getCompletedBy() {
    return this.#completedBy;
  }
}
