const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

exports.calculateTTL = (date, tz) => {
  const now = dayjs().tz(tz);
  const requestedDate = dayjs(date).tz(tz);

  // ✅ Today: Live update every 5 seconds
  if (requestedDate.isSame(now, "day")) {
    return 5;
  }

  // ✅ Past date: cache for 30 days
  if (requestedDate.isBefore(now, "day")) {
    return 60 * 60 * 24 * 30; // 30 days
  }

  // ✅ Future date: cache until 1 day before match
  const oneDayBeforeMatch = requestedDate.subtract(1, "day").startOf("day");
  const ttl = oneDayBeforeMatch.diff(now, "second");

  // If somehow TTL is negative or 0 (e.g., date is tomorrow but now is midnight), fallback to 5 min
  return ttl > 0 ? ttl : 60 * 5;
};
