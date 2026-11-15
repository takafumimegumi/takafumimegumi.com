import { VANCOUVER_UTC_OFFSET_MS } from "../constants";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Writes a time as it reads on a clock in Vancouver, such as "Nov 20, 10:00 AM". */
export function formatVancouverTime(time: Date): string {
  // Shifted by the offset, so the UTC getters read Vancouver's date and time.
  const shifted = new Date(time.getTime() + VANCOUVER_UTC_OFFSET_MS);
  const hours = shifted.getUTCHours();
  const minutes = String(shifted.getUTCMinutes()).padStart(2, "0");
  const month = MONTHS[shifted.getUTCMonth()];

  return `${month} ${shifted.getUTCDate()}, ${hours % 12 || 12}:${minutes} ${hours < 12 ? "AM" : "PM"}`;
}
