import { initPage } from "./script/pages.js";

const page = document.body.dataset.page;

if (page) {
  initPage(page);
}
