import Worker from './Worker.js';

export default class Manager extends Worker {
  /**
   * Manager(id, firstName, lastName, role, isActive, username, email, phoneNumber)
   * Manager(id, firstName, lastName)
   */
  constructor(...args) {
    switch (args.length) {
      case 8:
        super(...args);
        break;

      case 3:
        super();
        [this.id, this.firstName, this.lastName] = args;
        break;

      default:
        throw new TypeError('Manager expects 3 or 8 arguments');
    }
  }
}
