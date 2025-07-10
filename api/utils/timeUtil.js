const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

exports.calculateTTL = (date, tz) => {
  const now = dayjs().tz(tz);
  const requestedDate = dayjs(date).tz(tz);

  // Live day: cache for 5 seconds
  if (requestedDate.isSame(now, "day")) return 5;

  // Other days: cache until midnight
  const midnight = requestedDate.add(1, "day").startOf("day");
  return midnight.diff(now, "second");
};
