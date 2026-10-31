export default class DeliveryNote {
  #id = 0;
  #name = null;
  #description = null;
  #supplierId = 0;
  #suppilerName = null;
  #date = null;
  #dailyLog = null;
  #url = null;
  #constructionSiteName;
  #managerName = null;

  constructor(id, name, description, supplierId, suppilerName, date, url, dailyLogOrConstructionSiteName, managerName) {
    if (arguments.length !== 8 && arguments.length !== 9) {
      throw new TypeError('DeliveryNote expects 8 or 9 arguments');
    }

    this.#id = id;
    this.#name = name;
    this.#description = description;
    this.#supplierId = supplierId;
    this.#suppilerName = suppilerName;
    this.#date = date;
    this.#url = url;

    if (arguments.length === 8) {
      this.#dailyLog = dailyLogOrConstructionSiteName;
    } else {
      this.#constructionSiteName = dailyLogOrConstructionSiteName;
      this.#managerName = managerName;
    }
  }

  getDate() {
    return this.#date;
  }

  getSupplierName() {
    return this.#suppilerName;
  }

  getDescription() {
    return this.#description;
  }

  getName() {
    return this.#name;
  }

  getId() {
    return this.#id;
  }

  getSupplierId() {
    return this.#supplierId;
  }

  getUrl() {
    return this.#url;
  }

  getConstructionSiteName() {
    return this.#constructionSiteName;
  }

  getManagerName() {
    return this.#managerName;
  }
}
