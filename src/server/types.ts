export type Weekday = "0" | "1" | "2" | "3" | "4" | "5" | "6";

/** Start and end, as minutes from midnight in Vancouver. 600 is 10:00. */
export type TimeWindow = [start: number, end: number];

/** When I take calls. The values live in Worker configuration, not in the repository (ADR-0007). */
export interface AvailabilityRules {
  /** Open windows by weekday. "0" is Sunday. */
  windows: Partial<Record<Weekday, TimeWindow[]>>;
  slotMinutes: number;
  /** A slot must start at least this long after now. */
  minNoticeMinutes: number;
  /** How many Vancouver days are offered, counting today. */
  daysOffered: number;
  /** Free time kept before and after every busy time. */
  bufferMinutes: number;
}

/** A stretch of time when I am not free, such as another meeting. */
export interface BusyTime {
  start: Date;
  end: Date;
}

/** What the bot check said about a token (ADR-0006). */
export interface TokenCheck {
  valid: boolean;
  /** The action the widget was rendered with, such as "booking". */
  action?: string;
  /** The hostname of the page that produced the token. */
  hostname?: string;
}
