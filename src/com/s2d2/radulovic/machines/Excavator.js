import Machine from './Machine.js';

export default class Excavator extends Machine {
  #totalWorkHours = 0;

  /**
   * Excavator(excavatorId, name, type, licensePlate, status)
   * Excavator(other)
   */
  constructor(...args) {
    switch (args.length) {
      case 5:
        super(...args);
        break;

      case 1: {
        const [other] = args;
        super(other.getMachineId(), other.getName(), other.getType(), other.getLicensePlate(), other.getStatus());
        this.#totalWorkHours = other.#totalWorkHours;
        break;
      }

      default:
        throw new TypeError('Excavator expects 1 or 5 arguments');
    }
  }
}
