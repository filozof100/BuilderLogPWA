import Expense from './Expense.js';

export default class ManagerExpense extends Expense {
  #dailyLog = null;
  #url = null;
  #manager = null;

  constructor(...args) {
    if (args.length === 9 && typeof args[6] !== 'number') {
      const [id, title, description, amount, date, url, dailyLog, constructionSiteId, constructionSiteName] = args;
      super(id, title, description, amount, date, constructionSiteId, constructionSiteName);
      this.#url = url;
      this.#dailyLog = dailyLog;
    } else if (args.length === 8) {
      const [id, title, description, amount, date, url, constructionSiteId, constructionSiteName] = args;
      super(id, title, description, amount, date, constructionSiteId, constructionSiteName);
      this.#url = url;
    } else if (args.length === 9) {
      const [id, title, description, amount, date, url, constructionSiteId, constructionSiteName, manager] = args;
      super(id, title, description, amount, date, constructionSiteId, constructionSiteName);
      this.#url = url;
      this.#manager = manager;
    } else {
      throw new TypeError('ManagerExpense expects 8 or 9 arguments');
    }
  }

  getAmount() {
    return super.getAmount();
  }

  getDate() {
    return super.getDate();
  }

  getUrl() {
    return this.#url;
  }

  getDailyLog() {
    return this.#dailyLog;
  }

  getManager() {
    return this.#manager;
  }
}
