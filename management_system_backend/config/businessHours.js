/**
 * Integriti office working hours configuration.
 *
 * Default shift: 5:00 PM → 2:00 AM (next calendar day), 9 hours per shift.
 * Deadlines count only time inside this window (see businessHoursService).
 *
 * OFFICE_UTC_OFFSET_MINUTES: office timezone as minutes east of UTC.
 *   Pakistan = 300 (UTC+5). Adjust if the server runs in a different TZ.
 */
module.exports = {
  OFFICE_START_HOUR: Number(process.env.OFFICE_START_HOUR) || 17,
  OFFICE_END_HOUR: Number(process.env.OFFICE_END_HOUR) || 2,
  OFFICE_UTC_OFFSET_MINUTES:
    Number(process.env.OFFICE_UTC_OFFSET_MINUTES) || 300,
};
