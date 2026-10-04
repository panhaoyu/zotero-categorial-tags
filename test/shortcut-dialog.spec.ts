import { expect } from "chai";
import {
  ACTIVE_ITEM_BG,
  closeAllDialogs,
  createItemWithTags,
  delay,
  ensureDialog,
  FILTER_INPUT_ID,
  findDialogWindow,
  getDialogSpans,
  pressKeyOnDocument,
  pressShortcut,
  selectItem,
  waitForPlugin,
  waitUntil,
} from "./helpers";

const CATEGORY = "测试分类";
const TAG_SELECTED = "已选标签";
const TAG_UNSELECTED = "未选标签";

describe("标签对话框集成测试", () => {
  let item: Zotero.Item;

  before(async () => {
    await waitForPlugin();
    item = await createItemWithTags("集成测试条目", [
      `#${CATEGORY}/${TAG_SELECTED}`,
    ]);
    await createItemWithTags("集成测试条目（未选中）", [
      `#${CATEGORY}/${TAG_UNSELECTED}`,
    ]);
    // 等待插件标签缓存刷新（addTag 后 500ms 防抖）
    await delay(2000);
    await selectItem(item);
  });

  after(async () => {
    await closeAllDialogs();
  });

  it("Ctrl+T 应打开标签对话框", async () => {
    const dialog = await ensureDialog();
    expect(dialog.document.getElementById(FILTER_INPUT_ID)).to.not.equal(null);
  });

  it("点击未选标签应切换为选中态样式", async () => {
    const dialog = await ensureDialog();
    const spans = getDialogSpans(dialog);
    expect(spans.length, "对话框中应渲染分类标签").to.be.greaterThan(0);

    const inactive = spans.find(
      (span) => span.style.background === "transparent",
    );
    expect(inactive, "应存在未选中的标签").to.not.equal(undefined);

    inactive!.click();
    await delay(200);

    expect(inactive!.style.background).to.equal(ACTIVE_ITEM_BG);
  });

  it("Esc 应关闭对话框", async () => {
    const dialog = await ensureDialog();
    pressKeyOnDocument(dialog, {
      key: "Escape",
      code: "Escape",
      bubbles: true,
      cancelable: true,
    });
    await waitUntil(() => !findDialogWindow(), "对话框关闭");
    expect(findDialogWindow()).to.equal(null);
  });

  it("对话框打开后立即按 Esc 应能关闭（无需等待初始化）", async () => {
    await closeAllDialogs();
    pressShortcut();
    await waitUntil(() => !!findDialogWindow(), "对话框打开", 3000);
    const dialog = findDialogWindow()!;
    // 不等待初始化，立即按 Esc
    pressKeyOnDocument(dialog, {
      key: "Escape",
      code: "Escape",
      bubbles: true,
      cancelable: true,
    });
    await waitUntil(() => !findDialogWindow(), "对话框关闭", 3000);
  });
});
