import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

export function getAcademicYear(date = new Date()) {
  const currentMonth = dayjs(date).month(); 
  const currentYear = dayjs(date).year();

  if (currentMonth >= 7) { 
    return `AY${currentYear % 100}/${(currentYear % 100) + 1}`;
  } else { 
    return `AY${(currentYear % 100) - 1}/${currentYear % 100}`;
  }
}

export function getSemester(date = new Date()) {
  const currentMonth = dayjs(date).month();

  if (currentMonth >= 7 && currentMonth <= 11) { 
    return 1;
  } else { 
    return 2;
  }
}

export function getCurrentAcademicPeriod(date = new Date()) {
  const ay = getAcademicYear(date);
  const sem = getSemester(date);
  return `${ay} Semester ${sem}`;
}

export function getAcademicYearPeriods(date = new Date()) {
  const ay = getAcademicYear(date);
  return [`${ay} Semester 1`, `${ay} Semester 2`];
}

export function getPreviousAcademicPeriod(date = new Date()) {
  
  const prevDate = dayjs(date).subtract(6, 'month').toDate();
  return getCurrentAcademicPeriod(prevDate);
}