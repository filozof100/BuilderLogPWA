export default class Task {
  #id = 0;
  #title = null;
  #description = null;
  #dateCreated = null;
  #completedDate = null;
  #isNotificationVisited = false;
  #isCompleted = false;

  constructor(id, title, description, dateCreated, isNotificationVisited, isCompleted, completedDate) {
    this.#id = id;
    this.#title = title;
    this.#description = description;
    this.#dateCreated = Task.#formatDate(dateCreated);
    this.#isNotificationVisited = isNotificationVisited;
    this.#isCompleted = isCompleted;
    this.#completedDate = Task.#formatDate(completedDate);
  }

  getId() {
    return this.#id;
  }

  getTitle() {
    return this.#title;
  }

  getDescription() {
    return this.#description;
  }

  getDateCreated() {
    return this.#dateCreated;
  }

  isCompleted() {
    return this.#isCompleted;
  }

  isNotificationVisited() {
    return this.#isNotificationVisited;
  }

  getCompletedDate() {
    return this.#completedDate;
  }

  static #formatDate(value) {
    if (value == null || value.length < 10) {
      return value == null ? '' : value;
    }

    if (value.charAt(4) !== '-' || value.charAt(7) !== '-') {
      return value;
    }

    return value.substring(8, 10) + '.' +
      value.substring(5, 7) + '.' +
      value.substring(0, 4) + '.';
  }
}
