import { BASE_SCHEDULE_COURSES, COURSE_RESULTS, DAYS } from "./data.js";
import {
  appendDroppedCourseIds,
  getFilteredCandidateCourses,
  getCurrentScheduleCourses,
  getSuccessfulAddResults,
  loadCourseFilter,
  loadDroppedCourseIds,
  loadSelectedAddCourses,
  loadSelectedDropCourses,
  loadSubmissionMode,
  mergeSuccessfulAdds,
  parseTimeSlot,
} from "./store.js";

function createBadge(success) {
  const badgeClass = success ? "status-success" : "status-fail";
  const badgeText = success ? "成功" : "失敗";
  return `<span class="status-badge ${badgeClass}">${badgeText}</span>`;
}

function createCandidateCourseRow(course, seats) {
  return `
    <tr>
      <td>${course.id}</td>
      <td>${course.name}</td>
      <td>${course.credits}</td>
      <td>${course.teacher}</td>
      <td>${course.time}</td>
      <td>${course.room}</td>
      <td>${seats}</td>
      <td class="selection-cell">
        <input
          class="course-checkbox"
          type="checkbox"
          name="course-selection"
          value="${course.id}"
          data-course-name="${course.name}"
          data-course-time="${course.time}"
        />
      </td>
    </tr>
  `;
}

function getSeatText(courseId) {
  const seatMap = {
    CS201: "32 / 45",
    CS215: "40 / 50",
    GE118: "30 / 30",
    PE102: "28 / 35",
    CS310: "24 / 40",
    AR205: "16 / 25",
  };

  return seatMap[courseId] || "20 / 30";
}

export function renderAddCourseSelectionPage() {
  const filter = loadCourseFilter();
  const departmentNode = document.getElementById("selected-department");
  const gradeNode = document.getElementById("selected-grade");
  const tableBody = document.getElementById("candidate-course-table-body");
  const emptyState = document.getElementById("candidate-course-empty");

  if (!departmentNode || !gradeNode || !tableBody || !emptyState) {
    return;
  }

  departmentNode.textContent = filter.department;
  gradeNode.textContent = filter.grade;

  const courses = getFilteredCandidateCourses(filter);

  if (courses.length === 0) {
    tableBody.innerHTML = "";
    emptyState.textContent = "目前所選科系與年級尚無可加選課程。";
    return;
  }

  emptyState.textContent = "";
  tableBody.innerHTML = courses
    .map((course) => createCandidateCourseRow(course, getSeatText(course.id)))
    .join("");
}

export function renderTeacherSchedulePage() {
  const tableBody = document.getElementById("teacher-schedule-table-body");
  const summaryBody = document.getElementById("teacher-summary-body");

  if (!tableBody || !summaryBody) {
    return;
  }

  const allCourses = [...BASE_SCHEDULE_COURSES, ...Object.values(COURSE_RESULTS)];
  const teacherMap = new Map();

  tableBody.innerHTML = allCourses
    .map(
      (course) => `
        <tr>
          <td>${course.teacher}</td>
          <td>${course.name}</td>
          <td>${course.id}</td>
          <td>${course.credits}</td>
          <td>${course.time}</td>
          <td>${course.room}</td>
          <td>${course.department}</td>
          <td>${course.grade}</td>
        </tr>
      `,
    )
    .join("");

  allCourses.forEach((course) => {
    const list = teacherMap.get(course.teacher) || [];
    list.push(`${course.name}（${course.department} ${course.grade}）`);
    teacherMap.set(course.teacher, list);
  });

  summaryBody.innerHTML = Array.from(teacherMap.entries())
    .map(
      ([teacher, courses]) => `
        <tr>
          <th>${teacher}</th>
          <td>${courses.join("、")}</td>
        </tr>
      `,
    )
    .join("");
}

export function renderDropCourseOptions() {
  const tableBody = document.getElementById("drop-course-table-body");
  const summary = document.getElementById("drop-course-summary");
  const emptyState = document.getElementById("drop-course-empty");
  const submitButton = document.getElementById("submit-drop-selection");

  if (!tableBody || !summary || !emptyState || !submitButton) {
    return;
  }

  const courses = getCurrentScheduleCourses();
  summary.textContent = `目前課表共有 ${courses.length} 門課程可列入退選。`;

  if (courses.length === 0) {
    tableBody.innerHTML = "";
    emptyState.textContent = "目前課表沒有可退選課程。";
    submitButton.disabled = true;
    return;
  }

  emptyState.textContent = "";
  submitButton.disabled = false;
  tableBody.innerHTML = courses
    .map(
      (course) => `
        <tr>
          <td>${course.id}</td>
          <td>${course.name}</td>
          <td>${course.credits}</td>
          <td>${course.teacher}</td>
          <td>${course.time}</td>
          <td>${course.room}</td>
          <td>${course.source}</td>
          <td class="selection-cell">
            <input
              class="course-checkbox"
              type="checkbox"
              name="drop-course-selection"
              value="${course.id}"
              data-course-name="${course.name}"
              data-course-time="${course.time}"
            />
          </td>
        </tr>
      `,
    )
    .join("");
}

function setResultCopy(mode, selectedCount, successCount, failCount) {
  const heading = document.getElementById("result-page-heading");
  const lead = document.getElementById("result-page-lead");
  const note = document.getElementById("result-page-note");
  const status = document.getElementById("result-status-text");
  const description = document.getElementById("result-description-text");
  const backLink = document.getElementById("result-back-link");
  const detailTitle = document.getElementById("result-detail-title");
  const isAdd = mode === "add";

  if (!heading || !lead || !note || !status || !description || !backLink || !detailTitle) {
    return;
  }

  document.title = `${isAdd ? "加選送出結果" : "退選送出結果"} | 校務資訊系統`;
  heading.textContent = isAdd ? "加選送出結果" : "退選送出結果";
  lead.textContent = isAdd
    ? "本次加選已送出，系統依既有課表與課程名額進行靜態示意判斷。"
    : "本次退選已送出，系統依目前課表狀態進行靜態示意判斷。";
  note.textContent = isAdd
    ? "以下結果只顯示本次勾選送出的課程，並示範成功與失敗原因的呈現方式。"
    : "以下結果只顯示本次勾選退選的課程，並依目前課表狀態回傳結果。";
  detailTitle.textContent = isAdd ? "加選結果明細" : "退選結果明細";
  backLink.textContent = isAdd ? "返回選課頁" : "返回退選頁";
  backLink.href = isAdd ? "./add-course-select.html" : "./drop-course.html";

  if (selectedCount === 0) {
    status.textContent = isAdd ? "尚未送出任何加選課程" : "尚未送出任何退選課程";
    description.textContent = isAdd
      ? "請返回選課頁勾選課程後再送出，結果頁才會顯示比對明細。"
      : "請返回退選頁勾選課程後再送出，結果頁才會顯示處理明細。";
    return;
  }

  if (successCount > 0 && failCount > 0) {
    status.textContent = `已完成${isAdd ? "加選" : "退選"}送出，部分課程成功、部分課程失敗`;
    description.textContent = isAdd
      ? "系統已依既有課表與名額條件完成靜態比對，請查看各課程結果。"
      : "系統已依目前課表狀態完成退選判斷，請查看各課程結果。";
    return;
  }

  if (successCount > 0) {
    status.textContent = `已完成${isAdd ? "加選" : "退選"}送出，所選課程皆成功`;
    description.textContent = isAdd
      ? "本次勾選課程皆通過靜態比對，未發現衝堂或名額問題。"
      : "本次勾選課程皆已自目前課表中移除。";
    return;
  }

  status.textContent = `已完成${isAdd ? "加選" : "退選"}送出，所選課程皆失敗`;
  description.textContent = isAdd
    ? "本次勾選課程皆未通過靜態比對，請依原因調整後重新送出。"
    : "本次勾選課程皆未通過退選判斷，請確認目前課表狀態後再操作。";
}

function renderAddResultRows(selectedCourses) {
  let successCount = 0;
  let failCount = 0;

  const rows = selectedCourses
    .map((course) => {
      const result = COURSE_RESULTS[course.id];

      if (!result) {
        failCount += 1;
        return `
          <tr>
            <td>${course.id}</td>
            <td>${course.name || "未知課程"}</td>
            <td>${course.time || "-"}</td>
            <td>${createBadge(false)}</td>
            <td>查無此課程的靜態比對資料。</td>
          </tr>
        `;
      }

      if (result.success) {
        successCount += 1;
      } else {
        failCount += 1;
      }

      return `
        <tr>
          <td>${result.id}</td>
          <td>${result.name}</td>
          <td>${result.time}</td>
          <td>${createBadge(result.success)}</td>
          <td>${result.reason}</td>
        </tr>
      `;
    })
    .join("");

  mergeSuccessfulAdds(getSuccessfulAddResults(selectedCourses));
  return { rows, successCount, failCount };
}

function renderDropResultRows(selectedCourses) {
  const currentIds = new Set(getCurrentScheduleCourses().map((course) => course.id));
  const successfulDropIds = [];
  let successCount = 0;
  let failCount = 0;

  const rows = selectedCourses
    .map((course) => {
      if (currentIds.has(course.id)) {
        successCount += 1;
        successfulDropIds.push(course.id);
        currentIds.delete(course.id);
        return `
          <tr>
            <td>${course.id}</td>
            <td>${course.name || "未知課程"}</td>
            <td>${course.time || "-"}</td>
            <td>${createBadge(true)}</td>
            <td>已自本學期課表移除。</td>
          </tr>
        `;
      }

      failCount += 1;
      return `
        <tr>
          <td>${course.id}</td>
          <td>${course.name || "未知課程"}</td>
          <td>${course.time || "-"}</td>
          <td>${createBadge(false)}</td>
          <td>課程已不在目前課表中，無法重複退選。</td>
        </tr>
      `;
    })
    .join("");

  appendDroppedCourseIds(successfulDropIds);
  return { rows, successCount, failCount };
}

export function renderResultPage() {
  const resultTableBody = document.getElementById("result-table-body");
  const successNode = document.getElementById("success-count");
  const failNode = document.getElementById("fail-count");

  if (!resultTableBody || !successNode || !failNode) {
    return;
  }

  const mode = loadSubmissionMode();
  const selectedCourses =
    mode === "drop" ? loadSelectedDropCourses() : loadSelectedAddCourses();

  if (selectedCourses.length === 0) {
    resultTableBody.innerHTML = `
      <tr>
        <td class="empty-state" colspan="5">尚未勾選任何課程，請返回上一頁重新操作。</td>
      </tr>
    `;
    successNode.textContent = "0 門";
    failNode.textContent = "0 門";
    setResultCopy(mode, 0, 0, 0);
    return;
  }

  const renderer = mode === "drop" ? renderDropResultRows : renderAddResultRows;
  const { rows, successCount, failCount } = renderer(selectedCourses);

  resultTableBody.innerHTML = rows;
  successNode.textContent = `${successCount} 門`;
  failNode.textContent = `${failCount} 門`;
  setResultCopy(mode, selectedCourses.length, successCount, failCount);
}

function renderWeeklySchedule(courses) {
  const weeklyBody = document.getElementById("weekly-schedule-body");

  if (!weeklyBody) {
    return;
  }

  weeklyBody.innerHTML = Array.from({ length: 8 }, (_, index) => {
    const period = index + 1;
    const cells = DAYS.map((day) => {
      const course = courses.find((item) => {
        const slot = parseTimeSlot(item.time);
        return slot && slot.day === day && period >= slot.start && period <= slot.end;
      });

      if (!course) {
        return "<td></td>";
      }

      const addedClass = course.source === "加選成功" ? " course-slot-added" : "";
      return `
        <td class="course-slot${addedClass}">
          <strong>${course.name}</strong><br />
          ${course.room}<br />
          ${course.teacher}
        </td>
      `;
    }).join("");

    return `
      <tr>
        <th>${period}</th>
        ${cells}
      </tr>
    `;
  }).join("");
}

function renderScheduleCourseList(courses) {
  const listBody = document.getElementById("schedule-course-list");

  if (!listBody) {
    return;
  }

  listBody.innerHTML = courses
    .map((course) => {
      const sourceClass =
        course.source === "加選成功" ? "course-source-added" : "course-source-base";

      return `
        <tr>
          <td>${course.id}</td>
          <td>${course.name}</td>
          <td>${course.credits}</td>
          <td>${course.teacher}</td>
          <td>${course.time}</td>
          <td>${course.room}</td>
          <td class="${sourceClass}">${course.source}</td>
        </tr>
      `;
    })
    .join("");
}

export function renderSchedulePage() {
  const courses = getCurrentScheduleCourses();
  const addedSummary = document.getElementById("schedule-added-summary");
  const activeAddedCount = courses.filter((course) => course.source === "加選成功").length;
  const filter = loadCourseFilter();

  if (addedSummary) {
    addedSummary.textContent = `目前查看條件為 ${filter.department} ${filter.grade}，已併入 ${activeAddedCount} 門加選成功課程，累計退選 ${loadDroppedCourseIds().length} 門課程。`;
  }

  renderWeeklySchedule(courses);
  renderScheduleCourseList(courses);
}
