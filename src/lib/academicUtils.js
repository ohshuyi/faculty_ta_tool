import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

// Determines the Academic Year string (e.g., "AY25/26") for a given date
export function getAcademicYear(date = new Date()) {
  const currentMonth = dayjs(date).month(); // 0 = January, 11 = December
  const currentYear = dayjs(date).year();

  // AY starts in August
  if (currentMonth >= 7) { // August (index 7) to December
    return `AY${currentYear % 100}/${(currentYear % 100) + 1}`;
  } else { // January to July
    return `AY${(currentYear % 100) - 1}/${currentYear % 100}`;
  }
}

// Determines the Semester (1 or 2) for a given date
export function getSemester(date = new Date()) {
  const currentMonth = dayjs(date).month();
  // Rough estimate: Sem 1 is Aug-Dec, Sem 2 is Jan-May/June/July
  // Adjust the month indices (7 for August, 0 for January) if NTU has specific cutoffs
  if (currentMonth >= 7 && currentMonth <= 11) { // August to December
    return 1;
  } else { // January to July
    return 2;
  }
}

// Gets the full current academic period string
export function getCurrentAcademicPeriod(date = new Date()) {
  const ay = getAcademicYear(date);
  const sem = getSemester(date);
  return `${ay} Semester ${sem}`;
}

// Gets both semester period strings for the academic year of the given date
export function getAcademicYearPeriods(date = new Date()) {
  const ay = getAcademicYear(date);
  return [`${ay} Semester 1`, `${ay} Semester 2`];
}