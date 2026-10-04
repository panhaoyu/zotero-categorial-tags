import { expect } from "chai";
import {
  ACTIVE_ITEM_BG,
  FILTERED_ITEM_BG,
  clearSelection,
  closeAllDialogs,
  createItemWithTags,
  delay,
  ensureDialog,
  FILTER_INPUT_ID,
  findDialogWindow,
  findWindowByTitle,
  getAddon,
  getDialogSpans,
  getWindowTitles,
  pressKeyOnDocument,
  pressShortcut,
  selectItem,
  waitForPlugin,
  waitUntil,
} from "./helpers";

const CATEGORY = "对话框测试";
const TAG_A = "标签甲";
const TAG_B = "标签乙";
const TAG_C = "标签丙";

describe("标签对话框交互", () => {
  let item: Zotero.Item;

  before(async () => {
    await waitForPlugin();
    // 标签甲挂在选中条目上（已选），标签乙、丙挂在其他条目上（未选）
    item = await createItemWithTags("对话框测试条目", [
      `#${CATEGORY}/${TAG_A}`,
    ]);
    await createItemWithTags("对话框测试条目2", [`#${CATEGORY}/${TAG_B}`]);
    await createItemWithTags("对话框测试条目3", [`#${CATEGORY}/${TAG_C}`]);
    // 等待插件标签缓存刷新（addTag 后 500ms 防抖）
    await delay(2000);
    await selectItem(item);
  });

  afterEach(async () => {
    await closeAllDialogs();
  });

  it("再次点击已选标签应取消选中", async () => {
    const dialog = await ensureDialog();
    const spans = getDialogSpans(dialog);
    const active = spans.find(
      (span) => span.style.background === ACTIVE_ITEM_BG,
    );
    expect(active, "应存在已选中的标签").to.not.equal(undefined);

    active!.click();
    await delay(200);

    expect(active!.style.background).to.equal("transparent");
  });

  it("拼音筛选应过滤标签", async () => {
    const dialog = await ensureDialog();
    const input = dialog.document.getElementById(
      FILTER_INPUT_ID,
    ) as HTMLInputElement;
    expect(input).to.not.equal(null);

    const spans = getDialogSpans(dialog);
    const tagJia = spans.find((span) => span.innerText === TAG_A);
    const tagYi = spans.find((span) => span.innerText === TAG_B);
    const tagBing = spans.find((span) => span.innerText === TAG_C);
    expect(tagJia, `应渲染${TAG_A}`).to.not.equal(undefined);
    expect(tagYi, `应渲染${TAG_B}`).to.not.equal(undefined);
    expect(tagBing, `应渲染${TAG_C}`).to.not.equal(undefined);

    // 输入“yi”应只匹配“标签乙”（拼音 biaoqianyi）
    input.value = "yi";
    input.dispatchEvent(new dialog.Event("input", { bubbles: true }));
    await delay(200);

    expect(tagYi!.style.background, "匹配的未选标签应高亮").to.equal(
      FILTERED_ITEM_BG,
    );
    expect(tagBing!.style.background, "不匹配的未选标签应透明").to.equal(
      "transparent",
    );
    expect(tagJia!.style.background, "已选标签筛选时保持激活色").to.equal(
      ACTIVE_ITEM_BG,
    );

    // 清空筛选后恢复初始样式
    input.value = "";
    input.dispatchEvent(new dialog.Event("input", { bubbles: true }));
    await delay(200);

    expect(tagJia!.style.background).to.equal(ACTIVE_ITEM_BG);
    expect(tagYi!.style.background).to.equal("transparent");
    expect(tagBing!.style.background).to.equal("transparent");
  });

  it("Enter 应保存并关闭对话框", async () => {
    const dialog = await ensureDialog();
    const spans = getDialogSpans(dialog);
    // 明确点击“标签乙”（inactive），而非第一个未选标签
    const tagYi = spans.find((span) => span.innerText === TAG_B);
    expect(tagYi, `应渲染${TAG_B}`).to.not.equal(undefined);
    expect(tagYi!.style.background, `${TAG_B} 应为未选中`).to.equal(
      "transparent",
    );

    tagYi!.click();
    await delay(200);
    expect(tagYi!.style.background).to.equal(ACTIVE_ITEM_BG);

    pressKeyOnDocument(dialog, {
      key: "Enter",
      code: "Enter",
      bubbles: true,
      cancelable: true,
    });
    await waitUntil(() => !findDialogWindow(), "对话框关闭");
    await waitUntil(
      () => item.hasTag(`#${CATEGORY}/${TAG_B}`),
      `标签保存到条目：${TAG_B}`,
    );
    expect(item.hasTag(`#${CATEGORY}/${TAG_B}`)).to.equal(true);
  });

  it("Cancel 应关闭对话框且不保存", async () => {
    const dialog = await ensureDialog();
    const spans = getDialogSpans(dialog);
    const active = spans.find(
      (span) => span.style.background === ACTIVE_ITEM_BG,
    );
    expect(active, "应存在已选中的标签").to.not.equal(undefined);

    // 取消选中“标签甲”，然后点击取消按钮
    active!.click();
    await delay(200);
    expect(active!.style.background).to.equal("transparent");

    const cancelButton = dialog.document.getElementById("close-button");
    expect(cancelButton, "应存在取消按钮").to.not.equal(null);
    cancelButton!.click();
    await waitUntil(() => !findDialogWindow(), "对话框关闭");
    await delay(300);

    expect(item.hasTag(`#${CATEGORY}/${TAG_A}`), "取消后不应保存").to.equal(
      true,
    );
  });

  it("无选中条目时 Ctrl+T 应弹出提示", async () => {
    await clearSelection();

    // 通过插件 locale 获取提示窗口标题，避免依赖界面语言
    const locale = getAddon()?.data?.locale?.current;
    const infoTitle = locale?.formatMessagesSync([
      { id: "categorialtags-categorial-tags-dialog-title-info" },
    ])[0]?.value;
    expect(infoTitle, "应能读取提示窗口标题").to.not.equal(undefined);

    const windowCountBefore = getWindowTitles().length;
    pressShortcut();
    await waitUntil(
      () => !!findWindowByTitle(infoTitle!),
      "无选中提示窗口出现",
    );

    const hintWindow = findWindowByTitle(infoTitle!)!;
    // 提示窗口不应是标签对话框
    expect(hintWindow.document.getElementById(FILTER_INPUT_ID)).to.equal(null);
    hintWindow.close();
    await waitUntil(
      () => getWindowTitles().length === windowCountBefore,
      "提示窗口关闭",
    );

    // 恢复选中，避免影响其他用例
    await selectItem(item);
  });
});
