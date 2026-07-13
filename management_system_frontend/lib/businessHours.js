/**
 * Office-hours deadline math — mirrors backend businessHoursService.
 * Shift: 5:00 PM → 2:00 AM (UTC+5 office time).
 */
const OFFICE_START_HOUR = 17;
const OFFICE_END_HOUR = 2;
const OFFICE_UTC_OFFSET_MINUTES = 300;

const MS_PER_MIN = 60 * 1000;
const START_MIN = OFFICE_START_HOUR * 60;
const END_MIN = OFFICE_END_HOUR * 60;

const toOfficeParts = (date) => {
  const officeMs = date.getTime() + OFFICE_UTC_OFFSET_MINUTES * MS_PER_MIN;
  const d = new Date(officeMs);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
  };
};

const fromOfficeParts = (year, month, day, hour, minute, second = 0) => {
  const officeUtc = Date.UTC(year, month, day, hour, minute, second);
  return new Date(officeUtc - OFFICE_UTC_OFFSET_MINUTES * MS_PER_MIN);
};

const minutesFromMidnight = (hour, minute) => hour * 60 + minute;

const isWithinOfficeHours = (parts) => {
  const t = minutesFromMidnight(parts.hour, parts.minute);
  if (START_MIN > END_MIN) {
    return t >= START_MIN || t < END_MIN;
  }
  return t >= START_MIN && t < END_MIN;
};

const minutesRemainingInShift = (parts) => {
  const t = minutesFromMidnight(parts.hour, parts.minute);
  if (t >= START_MIN) {
    return 24 * 60 - t + END_MIN;
  }
  if (t < END_MIN) {
    return END_MIN - t;
  }
  return 0;
};

const snapToNextOfficeStart = (parts) => {
  if (isWithinOfficeHours(parts)) {
    return fromOfficeParts(
      parts.year,
      parts.month,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
  }
  const t = minutesFromMidnight(parts.hour, parts.minute);
  if (t >= END_MIN && t < START_MIN) {
    return fromOfficeParts(
      parts.year,
      parts.month,
      parts.day,
      OFFICE_START_HOUR,
      0,
      0
    );
  }
  return fromOfficeParts(
    parts.year,
    parts.month,
    parts.day,
    OFFICE_START_HOUR,
    0,
    0
  );
};

const addMinutes = (parts, minutes) => {
  const base = fromOfficeParts(
    parts.year,
    parts.month,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return new Date(base.getTime() + minutes * MS_PER_MIN);
};

export function addBusinessHours(startDate, hours) {
  let remaining = Math.round(Number(hours) * 60);
  if (remaining <= 0) return new Date(startDate);

  let current = snapToNextOfficeStart(toOfficeParts(new Date(startDate)));
  let guard = 0;

  while (remaining > 0 && guard < 10000) {
    guard += 1;
    let parts = toOfficeParts(current);

    if (!isWithinOfficeHours(parts)) {
      current = snapToNextOfficeStart(parts);
      parts = toOfficeParts(current);
    }

    const available = minutesRemainingInShift(parts);
    if (available <= 0) {
      current = snapToNextOfficeStart(parts);
      continue;
    }

    if (remaining <= available) {
      return addMinutes(parts, remaining);
    }

    remaining -= available;
    current = addMinutes(parts, available);
    const endParts = toOfficeParts(current);
    current = fromOfficeParts(
      endParts.year,
      endParts.month,
      endParts.day,
      OFFICE_START_HOUR,
      0,
      0
    );
  }

  return current;
}

export function computeTaskDeadline({ startTime, estimatedHours, useCurrentTime }) {
  const hours = Number(estimatedHours);
  if (!hours || hours <= 0) return null;

  let start = null;
  if (startTime) {
    start = new Date(startTime);
  } else if (useCurrentTime) {
    start = new Date();
  }

  if (!start || Number.isNaN(start.getTime())) return null;
  return addBusinessHours(start, hours);
}
