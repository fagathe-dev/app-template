var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// public/ts/utils/date.ts
var DateFormatter = class {
  /**
   * Return a full date formatted like `mercredi 2 avril 2025 à 23:29:37 UTC+2`
   * @param date
   * @returns {string}
   */
  static fullDate(date) {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: this.LOCAL_TIMEZONE
    }).format(date);
  }
  /**
   * Returns a date formatted in the short format like `12/12/2023`
   * @param date
   * @returns
   */
  static shortDate(date) {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeZone: this.LOCAL_TIMEZONE
    }).format(date);
  }
  /**
   * Modify a date by adding or subtracting days, months, years, minutes or hours
   *
   * @static
   * @param {Date} date
   * @param {{ [key: string]: number }} options
   * @returns {Date}
   */
  static mofify(date, options) {
    const newDate = new Date(date);
    if (options.days) {
      newDate.setDate(newDate.getDate() + options.days);
    }
    if (options.months) {
      newDate.setMonth(newDate.getMonth() + options.months);
    }
    if (options.years) {
      newDate.setFullYear(newDate.getFullYear() + options.years);
    }
    if (options.minutes) {
      newDate.setMinutes(newDate.getMinutes() + options.minutes);
    }
    if (options.hours) {
      newDate.setHours(newDate.getHours() + options.hours);
    }
    return newDate;
  }
  /**
   * If this function returns `true` the given date is in the past
   * @param date
   * @returns {boolean}
   */
  static isDateInPast(date) {
    const currentDate = /* @__PURE__ */ new Date();
    return date < currentDate;
  }
  /**
   * Description placeholder
   *
   * @static
   * @param {Date} date1
   * @param {(Date | undefined)} [date2=undefined]
   * @returns {DateDiff}
   */
  static diff(date1, date2 = void 0) {
    if (date2 === void 0) {
      date2 = /* @__PURE__ */ new Date();
    }
    let diff = Math.abs(date2.getTime() - date1.getTime());
    const years = Math.floor(diff / (1e3 * 60 * 60 * 24 * 365));
    diff -= years * (1e3 * 60 * 60 * 24 * 365);
    const months = Math.floor(diff / (1e3 * 60 * 60 * 24 * 30));
    diff -= months * (1e3 * 60 * 60 * 24 * 30);
    const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
    diff -= days * (1e3 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1e3 * 60 * 60));
    diff -= hours * (1e3 * 60 * 60);
    const minutes = Math.floor(diff / (1e3 * 60));
    diff -= minutes * (1e3 * 60);
    const seconds = Math.floor(diff / 1e3);
    return { years, months, days, hours, minutes, seconds };
  }
};
__publicField(DateFormatter, "LOCAL_TIMEZONE", "Europe/Paris");
