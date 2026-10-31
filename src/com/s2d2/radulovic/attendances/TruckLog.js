export default class TruckLog {
  #truckLogId = 0;
  #machineAssignmentId = null;
  #driverId = 0;
  #constructionSiteId = 0;
  #truck = null;
  #driverStartedAt = null;
  #driverFinishedAt = null;
  #managerStartedAt = null;
  #managerFinishedAt = null;
  #startKm = null;
  #endKm = null;
  #driverNote = null;
  #managerNote = null;
  #fuelAdded = null;
  #fuelRemaining = null;
  #date = null;
  #driverName = null;
  #constructionSiteName = null;

  constructor(...args) {
    if (args.length === 7 || (args.length === 8 && typeof args[1] === 'number')) {
      const [truckLogId, driverId, constructionSiteId, truck, managerStartedAt, managerFinishedAt, managerNote, machineAssignmentId = null] = args;
      this.#truckLogId = truckLogId;
      this.#driverId = driverId;
      this.#constructionSiteId = constructionSiteId;
      this.#truck = truck;
      this.#managerStartedAt = managerStartedAt ?? '';
      this.#managerFinishedAt = managerFinishedAt ?? '';
      this.#managerNote = managerNote ?? '';
      this.#machineAssignmentId = machineAssignmentId;
    } else if (args.length === 11) {
      const [truckLogId, truck, driverStartedAt, driverFinishedAt, startKm, endKm, driverNote, fuelAdded, fuelRemaining, managerStartedAt, managerFinishedAt] = args;
      this.#truckLogId = truckLogId;
      this.#truck = truck;
      this.#driverStartedAt = driverStartedAt;
      this.#driverFinishedAt = driverFinishedAt;
      this.#startKm = this.#parseNullableInt(startKm);
      this.#endKm = this.#parseNullableInt(endKm);
      this.#driverNote = driverNote;
      this.#fuelAdded = fuelAdded;
      this.#fuelRemaining = fuelRemaining;
      this.#managerStartedAt = managerStartedAt;
      this.#managerFinishedAt = managerFinishedAt;
    } else if (args.length === 8) {
      const [truckLogId, driverStartedAt, driverFinishedAt, startKm, endKm, date, managerStartedAt, managerFinishedAt] = args;
      this.#truckLogId = truckLogId;
      this.#driverStartedAt = driverStartedAt;
      this.#driverFinishedAt = driverFinishedAt;
      this.#startKm = this.#parseNullableInt(startKm);
      this.#endKm = this.#parseNullableInt(endKm);
      const parts = date.split('-');
      if (parts.length < 3) throw new TypeError('Invalid date: ' + date);
      this.#date = parts[2] + '.' + parts[1] + '.' + parts[0];
      this.#managerStartedAt = managerStartedAt;
      this.#managerFinishedAt = managerFinishedAt;
    } else if (args.length === 9) {
      const [truckLogId, startKm, endKm, date, managerNote, fuelAdded, fuelRemaining, driverName, constructionSiteName] = args;
      this.#truckLogId = truckLogId;
      this.#startKm = this.#parseNullableInt(startKm);
      this.#endKm = this.#parseNullableInt(endKm);
      const parts = date.split('-');
      if (parts.length < 3) throw new TypeError('Invalid date: ' + date);
      this.#date = parts[2] + '.' + parts[1] + '.' + parts[0];
      this.#managerNote = managerNote;
      this.#fuelAdded = fuelAdded;
      this.#fuelRemaining = fuelRemaining;
      this.#driverName = driverName;
      this.#constructionSiteName = constructionSiteName;
    } else {
      throw new TypeError('TruckLog expects 7, 8, 9, or 11 arguments');
    }
  }

  getTruckLogId() {
    return this.#truckLogId;
  }

  getTruck() {
    return this.#truck;
  }

  getDriverStartedAt() {
    return this.#driverStartedAt;
  }

  getDriverFinishedAt() {
    return this.#driverFinishedAt;
  }

  getStartKm() {
    return this.#startKm;
  }

  getEndKm() {
    return this.#endKm;
  }

  getDriverNote() {
    return this.#driverNote;
  }

  getFuelAdded() {
    return this.#fuelAdded;
  }

  getDate() {
    return this.#date;
  }

  getManagerStartedAt() {
    return this.#managerStartedAt;
  }

  getManagerFinishedAt() {
    return this.#managerFinishedAt;
  }

  getDriverName() {
    return this.#driverName;
  }

  getConstructionSiteName() {
    return this.#constructionSiteName;
  }

  getManagerNote() {
    return this.#managerNote;
  }

  getConstructionSiteId() {
    return this.#constructionSiteId;
  }

  getDriverId() {
    return this.#driverId;
  }

  getMachineAssignmentId() {
    return this.#machineAssignmentId;
  }

  getFuelRemainingDisplayValue() {
    if (this.#fuelRemaining == null) return '-';

    const fuelRemainingValue = Number(this.#fuelRemaining);
    if (this.#fuelRemaining.trim() === '' || (Number.isNaN(fuelRemainingValue) && this.#fuelRemaining.trim() !== 'NaN')) {
      throw new TypeError('Invalid fuel remaining: ' + this.#fuelRemaining);
    }

    if (Math.trunc(fuelRemainingValue) === 1) {
      return 'Pun';
    } else if (Math.trunc(fuelRemainingValue * 10) === 5) {
      return '1/2';
    } else if (Math.trunc(fuelRemainingValue * 100) === 25) {
      return '1/4';
    } else if (Math.trunc(fuelRemainingValue * 1000) === 130) {
      return '1/8';
    }

    return '-';
  }

  static getFuelRemainingRequestValue(displayValue) {
    if (displayValue == null) return null;

    switch (displayValue) {
      case 'Pun':
        return 1;
      case '1/2':
        return 0.5;
      case '1/4':
        return 0.25;
      case '1/8':
        return 0.125;
      default:
        return null;
    }
  }

  #parseNullableInt(value) {
    if (value == null || value.trim() === '' || value.toLowerCase() === 'null') {
      return null;
    }

    const trimmed = value.trim();
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) return /^[+-]?NaN$/.test(trimmed) ? 0 : null;
    // Match Java's double-to-int cast: truncate, clamp overflow, and normalize -0.
    return Math.trunc(Math.max(-2147483648, Math.min(2147483647, parsed))) || 0;
  }
}
