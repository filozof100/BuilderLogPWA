import WorkerTask from './WorkerTask.js';

export default class ManagerTask extends WorkerTask {
  #assignedTo = null;

  #completedBy = null;

  constructor(id, title, description, dateCreated, isVisited, isCompleted, assignedTo, completedBy, completedDate) {
    super(id, title, description, dateCreated, isVisited, isCompleted, completedDate);
    this.#assignedTo = assignedTo;
    this.#completedBy = completedBy;
  }

  getCompletedBy() {
    return this.#completedBy;
  }
}
