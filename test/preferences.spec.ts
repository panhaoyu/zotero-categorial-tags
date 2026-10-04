import { expect } from "chai";
import {
  CAPTURE_INPUT_ID,
  closeAllDialogs,
  delay,
  findCaptureDialogWindow,
  pressKey,
  waitForPlugin,
  waitUntil,
} from "./helpers";

const PREF_KEY = "extensions.zotero.categorialtags.shortcut";
const SHORTCUT_INPUT_ID =
  "zotero-prefpane-categorialtags-open-shortcut-key-input";
const CAPTURE_BUTTON_ID =
  "zotero-prefpane-categorialtags-capture-shortcut-button";

function findDeep(
  root: Document | ShadowRoot,
  selector: string,
  depth = 0,
): HTMLElement | null {
  if (depth > 10) return null;
  const el = root.querySelector(selector);
  if (el) return el as HTMLElement;
  for (const node of Array.from(root.querySelectorAll("*"))) {
    const element = node as Element | null;
    if (element?.shadowRoot) {
      const found = findDeep(element.shadowRoot, selector, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function findPrefWindow(): Window | null {
  const wm = Services.wm.getEnumerator("zotero:pref");
  if (wm.hasMoreElements()) return wm.getNext() as unknown as Window;
  return null;
}

function getShortcutInput(): HTMLInputElement | null {
  const win = findPrefWindow();
  if (!win) return null;
  return findDeep(
    win.document,
    `#${SHORTCUT_INPUT_ID}`,
  ) as HTMLInputElement | null;
}

function getCaptureButton(): HTMLElement | null {
  const win = findPrefWindow();
  if (!win) return null;
  return findDeep(win.document, `#${CAPTURE_BUTTON_ID}`);
}

describe("偏好设置", () => {
  before(async () => {
    await waitForPlugin();
    const win = Zotero.Utilities.Internal.openPreferences("general");
    expect(win, "偏好窗口应能打开").to.not.equal(null);
    await waitUntil(
      () => !!findDeep(win!.document, "#prefs-navigation"),
      "偏好窗口加载",
    );

    // 点击导航项切换到插件面板
    const navItem = findDeep(
      win!.document,
      'richlistitem[value*="categorialtags"]',
    );
    expect(navItem, "应存在插件偏好导航项").to.not.equal(null);
    navItem!.click();

    await waitUntil(
      () => !!getShortcutInput(),
      "插件偏好面板加载（快捷键输入框出现）",
    );
  });

  after(async () => {
    await closeAllDialogs();
    // 恢复默认快捷键偏好，避免影响其他测试
    Zotero.Prefs.set(PREF_KEY, "Ctrl+T", true);
    findPrefWindow()?.close();
  });

  it("偏好面板应显示当前快捷键", () => {
    const input = getShortcutInput();
    expect(input).to.not.equal(null);
    expect(input!.value).to.equal("Ctrl+T");
  });

  it("捕获对话框应捕获按键并支持 Esc 取消", async () => {
    const button = getCaptureButton();
    expect(button, "应存在捕获按钮").to.not.equal(null);
    button!.click();

    await waitUntil(() => !!findCaptureDialogWindow(), "捕获对话框打开");
    const captureWin = findCaptureDialogWindow()!;
    const captureInput = captureWin.document.getElementById(
      CAPTURE_INPUT_ID,
    ) as HTMLInputElement;

    pressKey(captureWin, {
      key: "k",
      code: "KeyK",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    await delay(200);
    expect(captureInput.value, "应捕获到组合键").to.equal("Ctrl+k");

    pressKey(captureWin, {
      key: "Escape",
      code: "Escape",
      bubbles: true,
      cancelable: true,
    });
    await waitUntil(() => !findCaptureDialogWindow(), "捕获对话框关闭");
    expect(Zotero.Prefs.get(PREF_KEY, true), "Esc 取消不应保存").to.equal(
      "Ctrl+T",
    );
  });

  it("捕获对话框 Accept 应保存偏好", async () => {
    const button = getCaptureButton();
    expect(button, "应存在捕获按钮").to.not.equal(null);
    button!.click();

    await waitUntil(() => !!findCaptureDialogWindow(), "捕获对话框打开");
    const captureWin = findCaptureDialogWindow()!;

    pressKey(captureWin, {
      key: "j",
      code: "KeyJ",
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    await delay(200);
    const acceptButton = captureWin.document.getElementById("accept-button");
    expect(acceptButton, "应存在接受按钮").to.not.equal(null);
    acceptButton!.click();

    await waitUntil(() => !findCaptureDialogWindow(), "捕获对话框关闭");
    expect(Zotero.Prefs.get(PREF_KEY, true), "接受后应保存偏好").to.equal(
      "Ctrl+Shift+j",
    );
    await waitUntil(
      () => getShortcutInput()?.value === "Ctrl+Shift+j",
      "偏好面板同步显示新快捷键",
    );
  });
});
