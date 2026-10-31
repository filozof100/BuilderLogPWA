export default class ConstructionSite {
  #id = 0;
  #name = null;
  #description = null;
  #canSelect = false;
  #isActive = false;

  #assignedManagers = null;

  /**
   * ConstructionSite(id, name, description, canSelect, isActive)
   * ConstructionSite(id, name, description, canSelect, isActive, assignedManagers)
   */
  constructor(id, name, description, canSelect, isActive, assignedManagers) {
    if (arguments.length !== 5 && arguments.length !== 6) {
      throw new TypeError('ConstructionSite expects 5 or 6 arguments');
    }
    this.#id = id;
    this.#name = name;
    this.#description = description;
    this.#canSelect = canSelect;
    this.#isActive = isActive;
    if (arguments.length === 6) {
      this.#assignedManagers = assignedManagers;
    }
  }

  getName() {
    return this.#name;
  }

  getId() {
    return this.#id;
  }

  canSelect() {
    return this.#canSelect;
  }

  isActive() {
    return this.#isActive;
  }

  setActive(active) {
    this.#isActive = active;
  }

  getAssignedManagers() {
    return this.#assignedManagers;
  }
}
