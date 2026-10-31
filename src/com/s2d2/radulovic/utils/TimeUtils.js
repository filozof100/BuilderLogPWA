export default class TimeUtils {
  static #UTC_DATE_TIME = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})$/;

  static convertTime(UTCTime) {
    if (UTCTime == null) {
      return '-';
    }

    const value = UTCTime.trim();
    if (value === '' || value.toLowerCase() === 'null' || value === '-') {
      return '-';
    }

    if (/^\d{1,2}:\d{2}$/.test(value)) {
      const parts = value.split(':');
      return parts[0].padStart(2, '0') + ':' + parts[1];
    }

    // Values created locally by the app are already in the device timezone.
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(value)) {
      return value.substring(11, 16);
    }

    const matcher = TimeUtils.#UTC_DATE_TIME.exec(value);
    if (matcher === null) {
      return '-';
    }

    let fraction = matcher[2] == null ? '000' : matcher[2];
    fraction = (fraction + '000').substring(0, 3);
    let zone = matcher[3];
    if (zone !== 'Z' && zone.length === 5) {
      zone = zone.substring(0, 3) + ':' + zone.substring(3);
    }
    const normalizedValue = matcher[1] + '.' + fraction + zone;
    const date = new Date(normalizedValue);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(date);
  }

  // Java Calendar is represented by a JavaScript Date, using the device timezone.
  static formatDate(date) {
    return String(date.getFullYear()).padStart(4, '0') + '-'
      + String(date.getMonth() + 1).padStart(2, '0') + '-'
      + String(date.getDate()).padStart(2, '0');
  }
}
