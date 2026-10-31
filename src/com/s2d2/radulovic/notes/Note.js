export default class Note {
  #id = 0;
  #note = null;
  #attachments = null;
  #dailyLog = null;
  #date = null;
  #manager = '';
  #constructionSiteName = '';

  #workerCount = 0;

  constructor(...args) {
    if (args.length === 5) {
      const [id, note, attachments, dailyLog, workerCount] = args;
      this.#id = id;
      this.#note = note;
      this.#attachments = Object.freeze([...attachments]);
      this.#dailyLog = dailyLog;
      this.#workerCount = workerCount;
      this.#date = Note.#formatDate(dailyLog.getDailyLogDate());
    } else if (args.length === 7) {
      const [id, note, attachments, date, manager, constructionSiteName, workerCount] = args;
      this.#id = id;
      this.#note = note;
      this.#attachments = Object.freeze([...attachments]);
      this.#date = Note.#formatDate(date);
      this.#manager = manager;
      this.#constructionSiteName = constructionSiteName;
      this.#workerCount = workerCount;
    } else {
      throw new TypeError('Note expects 5 or 7 arguments');
    }
  }

  static #formatDate(value) {
    if (value == null || value.length < 10) {
      return '';
    }
    if (value.charAt(4) === '-' && value.charAt(7) === '-') {
      return value.substring(8, 10) + '.' + value.substring(5, 7) + '.' +
        value.substring(0, 4) + '.';
    }
    return value;
  }

  getId() {
    return this.#id;
  }

  getNote() {
    return this.#note;
  }

  getAttachments() {
    return this.#attachments;
  }

  getDailyLog() {
    return this.#dailyLog;
  }

  getDate() {
    return this.#date;
  }

  getManager() {
    return this.#manager;
  }

  getConstructionSiteName() {
    return this.#constructionSiteName;
  }

  getWorkerCount() {
    return this.#workerCount;
  }
}
