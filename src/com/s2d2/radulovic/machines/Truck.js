import Machine from './Machine.js';

export default class Truck extends Machine {
  #currentKm = 0;

  /**
   * Truck(truckId, name, type, licensePlate, status)
   * Truck(other)
   */
  constructor(...args) {
    switch (args.length) {
      case 5:
        super(...args);
        break;

      case 1: {
        const [other] = args;
        super(other.getMachineId(), other.getName(), other.getType(), other.getLicensePlate(), other.getStatus());
        this.#currentKm = other.#currentKm;
        break;
      }

      default:
        throw new TypeError('Truck expects 1 or 5 arguments');
    }
  }
}
