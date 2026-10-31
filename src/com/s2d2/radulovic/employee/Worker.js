// Port of employee/Worker.java. Constructor overloads and methods follow Java order.
// Java's protected fields remain accessible to subclasses; private fields use #.
// Serializable/serialVersionUID have no Java object-stream equivalent in browsers.
export default class Worker {
  static #serialVersionUID = 1;

  id = 0;
  firstName = null;
  lastName = null;
  #username = null;
  #role = null;
  #phoneNumber = null;
  #email = null;
  #isActive = false;

  /**
   * Worker()
   * Worker(id, firstName, lastName, role, isActive, username, email, phoneNumber)
   * Worker(id, firstName, lastName)
   * Worker(id, firstName, lastName, role)
   *
   * Role is retained as supplied; no enum dependency is required in JavaScript.
   */
  constructor(...args) {
    switch (args.length) {
      case 0:
        break;

      case 8: {
        const [id, firstName, lastName, role, isActive, username, email, phoneNumber] = args;
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.#role = role;
        this.#isActive = isActive;
        this.#username = username;
        this.#email = email == null ? '' : email;
        console.error('EMAIL', this.#email); // Android Log.e("EMAIL", this.email).
        this.#phoneNumber = phoneNumber == null ? '' : phoneNumber;
        break;
      }

      case 3: {
        const [id, firstName, lastName] = args;
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        break;
      }

      case 4: {
        const [id, firstName, lastName, role] = args;
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.#role = role;
        break;
      }

      default:
        throw new TypeError('Worker expects 0, 3, 4, or 8 arguments');
    }
  }

  getRole() {
    return this.#role;
  }

  getFullName() {
    return this.firstName + ' ' + this.lastName;
  }

  getFirstName() {
    return this.firstName;
  }

  setFirstName(firstName) {
    this.firstName = firstName;
  }

  getLastName() {
    return this.lastName;
  }

  setLastName(lastName) {
    this.lastName = lastName;
  }

  getUsername() {
    return this.#username;
  }

  setUsername(username) {
    this.#username = username == null ? '' : username;
  }

  toString() {
    return this.firstName + ' ' + this.lastName + ' ' + this.id + ' ' + this.#role;
  }

  getId() {
    return this.id;
  }

  getPhoneNumber() {
    return this.#phoneNumber;
  }

  setPhoneNumber(phoneNumber) {
    this.#phoneNumber = phoneNumber == null ? '' : phoneNumber;
  }

  getEmail() {
    return this.#email;
  }

  setEmail(email) {
    this.#email = email == null ? '' : email;
  }

  isActive() {
    return this.#isActive;
  }
}
