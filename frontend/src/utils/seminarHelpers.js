// Small pure functions shared by the student and psychologist dashboards.

// Today's date as "YYYY-MM-DD" in the viewer's own time zone.
export const todayString = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// The calendar day a seminar is on, as "YYYY-MM-DD".
// Read from the stored text instead of building a Date, so time zones can't shift it.
export const dayOf = (seminar) => String(seminar.date).slice(0, 10)

// True when the seminar matches the search text.
export const matchesSearch = (seminar, query) => {
  const q = String(query || "").trim().toLowerCase()
  if (!q) return true
  const haystack = [seminar.title, seminar.description, seminar.location, seminar.speaker]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return haystack.includes(q)
}

// Splits a list into { upcoming, past }.
// Upcoming is soonest first; past is most recent first.
export const splitSeminars = (seminars, query = "") => {
  const today = todayString()
  const list = (Array.isArray(seminars) ? seminars : []).filter((s) => matchesSearch(s, query))
  return {
    upcoming: list
      .filter((s) => dayOf(s) >= today)
      .sort((a, b) => dayOf(a).localeCompare(dayOf(b))),
    past: list
      .filter((s) => dayOf(s) < today)
      .sort((a, b) => dayOf(b).localeCompare(dayOf(a))),
  }
}