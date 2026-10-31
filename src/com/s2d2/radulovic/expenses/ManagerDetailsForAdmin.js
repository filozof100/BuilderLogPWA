export default class ManagerDetailsForAdmin {
  #constructionSiteId = 0;
  #constructionSite = null;
  #expenses = null;
  #advances = null;
  #expensesByDate = null;

  constructor(constructionSiteId, constructionSite, expenses, advances) {
    this.#constructionSiteId = constructionSiteId;
    this.#constructionSite = constructionSite;
    expenses.sort((o1, o2) => ManagerDetailsForAdmin.#compareDatesDescending(o1.getDate(), o2.getDate()));
    this.#expenses = expenses;
    advances.sort((o1, o2) => ManagerDetailsForAdmin.#compareDatesDescending(o1.getDate(), o2.getDate()));
    this.#advances = advances;

    this.#expensesByDate = new Map();
    this.#calculateExpenses();
  }

  getConstructionSite() {
    return this.#constructionSite;
  }

  getExpenses() {
    return this.#expenses;
  }

  getAdvances() {
    return this.#advances;
  }

  #calculateExpenses() {
    for (const expense of this.#expenses) {
      if (!this.#expensesByDate.has(expense.getDate())) {
        this.#expensesByDate.set(expense.getDate(), Object.freeze({ first: 0, second: 0 }));
      }
      const expensesSum = this.#expensesByDate.get(expense.getDate()).first;
      const advancesSum = this.#expensesByDate.get(expense.getDate()).second;
      const amount = Math.trunc(Number(expense.getAmount().replaceAll(',', '.')));
      this.#expensesByDate.set(expense.getDate(), Object.freeze({ first: expensesSum + amount, second: advancesSum }));
    }

    for (const advance of this.#advances) {
      if (!this.#expensesByDate.has(advance.getDate())) {
        this.#expensesByDate.set(advance.getDate(), Object.freeze({ first: 0, second: 0 }));
      }
      const expensesSum = this.#expensesByDate.get(advance.getDate()).first;
      const advancesSum = this.#expensesByDate.get(advance.getDate()).second;
      this.#expensesByDate.set(advance.getDate(), Object.freeze({
        first: expensesSum,
        second: advancesSum + Math.trunc(advance.getAmount()),
      }));
    }

    this.#expensesByDate = new Map(
      [...this.#expensesByDate].sort(([first], [second]) => ManagerDetailsForAdmin.#compareDatesDescending(first, second)),
    );
  }

  getExpensesByDate() {
    return this.#expensesByDate;
  }

  static #compareDatesDescending(first, second) {
    const firstKey = ManagerDetailsForAdmin.#dateSortKey(first);
    const secondKey = ManagerDetailsForAdmin.#dateSortKey(second);
    return secondKey < firstKey ? -1 : secondKey > firstKey ? 1 : 0;
  }

  static #dateSortKey(date) {
    if (date == null || date.length < 10) {
      return '';
    }
    return date.substring(6, 10) + date.substring(3, 5) + date.substring(0, 2);
  }
}
