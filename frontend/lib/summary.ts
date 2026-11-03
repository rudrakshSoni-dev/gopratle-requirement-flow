import { formatDateRange, formatDuration, formatINR } from "./format";
import { labelFor, type Category } from "./options";
import type { DetailsForm } from "./schema";

export type Row = { label: string; value: string };

const list = (v?: string[], fmt: (s: string) => string = (s) => s) => (v?.length ? v.map(fmt).join(", ") : "—");
const text = (v?: string | number) => (v === undefined || v === "" || Number.isNaN(v) ? "—" : String(v));
const yesNo = (v?: boolean) => (v === undefined ? "—" : v ? "Yes" : "No");
const budgetRange = (d: DetailsForm) => `${formatINR(d.budgetMin)} – ${formatINR(d.budgetMax)}`;

export type SummarySource = {
  eventName: string;
  eventType: string;
  dateType: string;
  startDate?: string;
  endDate?: string;
  location: string;
  venue?: string;
  category: Category | "";
  details: DetailsForm;
  contact?: { name: string; email: string; phone: string };
};

export function basicsRows(r: SummarySource): Row[] {
  return [
    { label: "Event name", value: text(r.eventName) },
    { label: "Event type", value: r.eventType ? labelFor(r.eventType) : "—" },
    { label: r.dateType === "range" ? "Dates" : "Date", value: formatDateRange(r.dateType, r.startDate, r.endDate) || "—" },
    { label: "Location", value: text(r.location) },
    { label: "Venue", value: text(r.venue) },
  ];
}

/** Rows for the two category-specific steps, in step order. */
export function detailRows(category: Category, d: DetailsForm): [Row[], Row[]] {
  switch (category) {
    case "planner":
      return [
        [
          { label: "Services needed", value: list(d.services, labelFor) },
          { label: "Guest count", value: text(d.guestCount) },
          { label: "Budget", value: budgetRange(d) },
        ],
        [
          { label: "Theme / style", value: text(d.theme) },
          { label: "Planner experience", value: d.experienceLevel ? labelFor(d.experienceLevel) : "—" },
          { label: "Notes", value: text(d.notes) },
        ],
      ];
    case "performer":
      return [
        [
          { label: "Performer type", value: d.performerType ? labelFor(d.performerType) : "—" },
          { label: "Genres", value: list(d.genres) },
          { label: "Number of performers", value: text(d.performerCount) },
          { label: "Performance length", value: formatDuration(d.durationMinutes) },
        ],
        [
          { label: "Languages", value: list(d.languages) },
          { label: "Sound & stage provided by host", value: yesNo(d.equipmentProvided) },
          { label: "Budget", value: budgetRange(d) },
          { label: "Notes", value: text(d.notes) },
        ],
      ];
    case "crew":
      return [
        [
          {
            label: "Roles",
            value: d.roles?.length ? d.roles.map((r) => `${r.count} × ${r.role ? labelFor(r.role) : "?"}`).join(", ") : "—",
          },
        ],
        [
          { label: "Call time", value: text(d.callTime) },
          { label: "Hours per day", value: text(d.hoursPerDay) },
          { label: "Budget per person / day", value: formatINR(d.budgetPerPerson) },
          { label: "Equipment provided by host", value: yesNo(d.equipmentProvided) },
          { label: "Notes", value: text(d.notes) },
        ],
      ];
  }
}
