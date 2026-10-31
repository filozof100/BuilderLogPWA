import Task from './Task.js';

export default class GeneralTask extends Task {
  #managerCompletedBy = null;

  constructor(id, title, description, dateCreated, isNotificationVisited, isCompleted, managerCompletedBy, completedDate) {
    super(id, title, description, dateCreated, isNotificationVisited, isCompleted, completedDate);
    this.#managerCompletedBy = managerCompletedBy;
  }

  getManagerCompletedBy() {
    return this.#managerCompletedBy;
  }
}
