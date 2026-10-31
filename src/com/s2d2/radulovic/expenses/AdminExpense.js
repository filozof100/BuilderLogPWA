import Expense from './Expense.js';

export default class AdminExpense extends Expense {
  constructor(id, title, description, amount, date, constructionSiteId, constructionSiteName) {
    super(id, title, description, amount, date, constructionSiteId, constructionSiteName);
  }
}
