const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

exports.calculateTTL = (date, tz) => {
  const now = dayjs().tz(tz);
  const requestedDate = dayjs(date).tz(tz);

  // If same day, short cache (5 s)
  if (requestedDate.isSame(now, "day")) return 5;

  // Else, cache until midnight
  const midnight = requestedDate.add(1, "day").startOf("day");
  return midnight.diff(now, "second");
};
