import {
  renderAddCourseSelectionPage,
  renderDropCourseOptions,
  renderResultPage,
  renderSchedulePage,
  renderTeacherSchedulePage,
} from "./render.js";
import {
  getSuccessfulAddResults,
  loadCourseFilter,
  mergeSuccessfulAdds,
  saveCourseFilter,
  saveSelection,
  saveSubmissionMode,
  STORAGE_KEYS,
} from "./store.js";

function collectSelectedCourses() {
  const checkboxes = document.querySelectorAll(".course-checkbox:checked");
  return Array.from(checkboxes).map((checkbox) => ({
    id: checkbox.value,
    name: checkbox.dataset.courseName || "",
    time: checkbox.dataset.courseTime || "",
  }));
}

function setupAddCoursePage() {
  const department = document.getElementById("department");
  const grade = document.getElementById("grade");
  const submitButton = document.getElementById("enter-add-course");

  if (!department || !grade || !submitButton) {
    return;
  }

  const filter = loadCourseFilter();
  department.value = filter.department;
  grade.value = filter.grade;

  submitButton.addEventListener("click", () => {
    saveCourseFilter({
      department: department.value,
      grade: grade.value,
    });

    window.location.href = "./add-course-select.html";
  });
}

function setupAddCourseSelectPage() {
  renderAddCourseSelectionPage();

  const submitButton = document.getElementById("submit-selection");
  const feedback = document.getElementById("selection-feedback");

  if (!submitButton || !feedback) {
    return;
  }

  submitButton.addEventListener("click", () => {
    const selectedCourses = saveSelection(STORAGE_KEYS.addSelection, collectSelectedCourses());

    if (selectedCourses.length === 0) {
      feedback.textContent = "請至少勾選 1 門課程後再送出。";
      return;
    }

    mergeSuccessfulAdds(getSuccessfulAddResults(selectedCourses));
    saveSubmissionMode("add");
    feedback.textContent = "";
    window.location.href = "./result.html";
  });
}

function setupDropCoursePage() {
  renderDropCourseOptions();

  const submitButton = document.getElementById("submit-drop-selection");
  const feedback = document.getElementById("drop-selection-feedback");

  if (!submitButton || !feedback) {
    return;
  }

  submitButton.addEventListener("click", () => {
    const selectedCourses = saveSelection(STORAGE_KEYS.dropSelection, collectSelectedCourses());

    if (selectedCourses.length === 0) {
      feedback.textContent = "請至少勾選 1 門課程後再送出退選。";
      return;
    }

    saveSubmissionMode("drop");
    feedback.textContent = "";
    window.location.href = "./result.html";
  });
}

export function initPage(page) {
  if (page === "add-course") {
    setupAddCoursePage();
  }

  if (page === "add-course-select") {
    setupAddCourseSelectPage();
  }

  if (page === "drop-course") {
    setupDropCoursePage();
  }

  if (page === "result") {
    renderResultPage();
  }

  if (page === "schedule") {
    renderSchedulePage();
  }

  if (page === "teacher-schedule") {
    renderTeacherSchedulePage();
  }
}
