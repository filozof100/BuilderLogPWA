import Task from './Task.js';

export default class WorkerTask extends Task {
  #assignedTo = null;
  #completedBy = null;

  constructor(...args) {
    if (args.length === 7) {
      const [id, title, description, dateCreated, isNotificationVisited, isCompleted, completedDate] = args;
      super(id, title, description, dateCreated, isNotificationVisited, isCompleted, completedDate);
    } else if (args.length === 9) {
      const [id, title, description, dateCreated, isNotificationVisited, isCompleted, assignedTo, completedBy, completedDate] = args;
      super(id, title, description, dateCreated, isNotificationVisited, isCompleted, completedDate);
      this.#assignedTo = assignedTo;
      this.#completedBy = completedBy;
    } else {
      throw new TypeError('WorkerTask expects 7 or 9 arguments');
    }
  }

  getCompletedBy() {
    return this.#completedBy;
  }
}
