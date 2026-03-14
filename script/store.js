import { BASE_SCHEDULE_COURSES, COURSE_RESULTS, STORAGE_KEYS } from "./data.js";

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}

export function loadSelectedAddCourses() {
  return loadJson(STORAGE_KEYS.addSelection, []);
}

export function loadSelectedDropCourses() {
  return loadJson(STORAGE_KEYS.dropSelection, []);
}

export function loadSuccessfulAdds() {
  return loadJson(STORAGE_KEYS.successfulAdds, []);
}

export function loadDroppedCourseIds() {
  return loadJson(STORAGE_KEYS.droppedCourseIds, []);
}

export function loadSubmissionMode() {
  return localStorage.getItem(STORAGE_KEYS.submissionMode) || "add";
}

export function saveSubmissionMode(mode) {
  localStorage.setItem(STORAGE_KEYS.submissionMode, mode);
}

export function loadCourseFilter() {
  return loadJson(STORAGE_KEYS.courseFilter, {
    department: "資訊工程學系",
    grade: "二年級",
  });
}

export function saveCourseFilter(filter) {
  saveJson(STORAGE_KEYS.courseFilter, filter);
}

export function saveSelection(storageKey, selectedCourses) {
  saveJson(storageKey, selectedCourses);
  return selectedCourses;
}

export function parseTimeSlot(time) {
  const [day, periods] = time.split(" ");

  if (!day || !periods) {
    return null;
  }

  const [start, end] = periods.split("-").map(Number);
  return { day, start, end };
}

export function getCurrentScheduleCourses() {
  const droppedIds = new Set(loadDroppedCourseIds());
  const merged = [...BASE_SCHEDULE_COURSES, ...loadSuccessfulAdds()];
  const unique = new Map();

  merged.forEach((course) => {
    if (!droppedIds.has(course.id)) {
      unique.set(course.id, course);
    }
  });

  return Array.from(unique.values());
}

export function getFilteredCandidateCourses(filter) {
  return Object.values(COURSE_RESULTS).filter(
    (course) =>
      course.department === filter.department && course.grade === filter.grade,
  );
}

export function getSuccessfulAddResults(selectedCourses) {
  return selectedCourses
    .map((course) => COURSE_RESULTS[course.id])
    .filter((course) => course && course.success)
    .map((course) => ({
      id: course.id,
      name: course.name,
      credits: course.credits,
      teacher: course.teacher,
      time: course.time,
      room: course.room,
      source: "加選成功",
    }));
}

export function mergeSuccessfulAdds(newCourses) {
  const merged = new Map();
  const droppedIds = new Set(loadDroppedCourseIds());

  loadSuccessfulAdds().forEach((course) => {
    merged.set(course.id, course);
  });

  newCourses.forEach((course) => {
    merged.set(course.id, course);
    droppedIds.delete(course.id);
  });

  saveJson(STORAGE_KEYS.successfulAdds, Array.from(merged.values()));
  saveJson(STORAGE_KEYS.droppedCourseIds, Array.from(droppedIds));
}

export function appendDroppedCourseIds(ids) {
  const droppedIds = new Set(loadDroppedCourseIds());
  ids.forEach((id) => droppedIds.add(id));
  saveJson(STORAGE_KEYS.droppedCourseIds, Array.from(droppedIds));
}

export { COURSE_RESULTS, STORAGE_KEYS };
