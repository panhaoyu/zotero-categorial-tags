import { expect } from "chai";

const PLUGIN_INSTANCE = "CategorialTags";
const FILTER_INPUT_ID = "zotero-categorial-tags-filter-input";
const TEST_ITEM_TITLE = "集成测试条目";
const ACTIVE_ITEM_BG = "rgb(239, 210, 255)";

interface AddonLike {
  data: {
    alive: boolean;
    ztoolkit?: {
      Keyboard?: {
        _keyboardCallbacks?: { size: number };
      };
    };
  };
  hooks?: {
    onShortcuts?: (type: string) => void;
  };
}

function getAddon(): AddonLike | undefined {
  const globals = Zotero as unknown as Record<string, unknown>;
  return globals[PLUGIN_INSTANCE] as AddonLike | undefined;
}

function delay(ms: number): Promise<void> {
  return Zotero.Promise.delay(ms);
}

async function waitUntil(
  condition: () => boolean,
  message: string,
  timeout = 15000,
  interval = 100,
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error(`等待超时：${message}`);
    }
    await delay(interval);
  }
}

function findDialogWindow(): Window | null {
  const wm = Services.wm.getEnumerator(null as unknown as string);
  while (wm.hasMoreElements()) {
    const win = wm.getNext() as unknown as Window;
    try {
      // 通过对话框内元素的 id 识别，避免依赖界面语言
      if (win.document?.getElementById(FILTER_INPUT_ID)) {
        return win;
      }
    } catch {
      // 忽略无法访问的窗口
    }
  }
  return null;
}

interface KeyboardEventWindow extends Window {
  KeyboardEvent: new (type: string, init?: KeyboardEventInit) => KeyboardEvent;
}

function makeKeyEvent(target: Window, init: KeyboardEventInit): KeyboardEvent {
  const ctor = (target as KeyboardEventWindow).KeyboardEvent;
  return new ctor("keydown", init);
}

function pressShortcut(): void {
  const win = Zotero.getMainWindow();
  const event = makeKeyEvent(win, {
    key: "t",
    code: "KeyT",
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
  });
  win.dispatchEvent(event);
}

function getWindowTitles(): string[] {
  const titles: string[] = [];
  const wm = Services.wm.getEnumerator(null as unknown as string);
  while (wm.hasMoreElements()) {
    const win = wm.getNext() as unknown as Window;
    try {
      titles.push(win.document?.title ?? "?");
    } catch {
      titles.push("<无法访问>");
    }
  }
  return titles;
}

function getDiagnostics(): string {
  const pane = Zotero.getActiveZoteroPane();
  return JSON.stringify({
    windowTitles: getWindowTitles(),
    hasPane: !!pane,
    selectedCount: pane ? pane.getSelectedItems().length : -1,
    tabs: pane
      ? pane.getState().tabs.map((tab) => `${tab.type}:${tab.selected}`)
      : [],
    callbacks: getAddon()?.data?.ztoolkit?.Keyboard?._keyboardCallbacks?.size,
  });
}

async function ensureDialog(): Promise<Window> {
  if (!findDialogWindow()) {
    pressShortcut();
  }
  try {
    await waitUntil(() => !!findDialogWindow(), "标签对话框打开", 3000);
  } catch {
    // 键盘分发未生效时，直接调用插件回调做二分诊断
    void getAddon()?.hooks?.onShortcuts?.("open-tag-tab");
    await delay(1500);
    if (findDialogWindow()) {
      throw new Error(
        "诊断：键盘事件未触发回调，但直接调用 onShortcuts 可以打开对话框",
      );
    }
    throw new Error(`诊断：${getDiagnostics()}`);
  }
  // 等待对话框完成初始化（open() 内部延迟 300ms 后才注册键盘监听）
  await delay(600);
  return findDialogWindow()!;
}

describe("标签对话框集成测试", () => {
  let item: Zotero.Item;

  before(async () => {
    await waitUntil(
      () => !!getAddon()?.data?.ztoolkit?.Keyboard?._keyboardCallbacks?.size,
      "插件初始化（快捷键注册）",
    );

    // 准备测试数据：选中条目带"已选标签"，另有一条目带"未选标签"
    item = new Zotero.Item("book");
    item.setField("title", TEST_ITEM_TITLE);
    await item.saveTx();
    item.addTag("#测试分类/已选标签");
    await item.saveTx();

    const otherItem = new Zotero.Item("book");
    otherItem.setField("title", `${TEST_ITEM_TITLE}（未选中）`);
    await otherItem.saveTx();
    otherItem.addTag("#测试分类/未选标签");
    await otherItem.saveTx();

    // 等待插件标签缓存刷新（addTag 后 500ms 防抖）
    await delay(2000);

    // 选中测试条目
    const pane = Zotero.getActiveZoteroPane();
    expect(pane, "应存在活动的 Zotero 面板").to.not.equal(null);
    pane!.selectItem(item.id, true);
    await waitUntil(
      () =>
        pane!.getSelectedItems().some((selected) => selected.id === item.id),
      "条目选中",
    );
  });

  after(() => {
    // 关闭所有遗留的对话框
    let dialog = findDialogWindow();
    while (dialog) {
      dialog.close();
      dialog = findDialogWindow();
    }
  });

  it("Ctrl+T 应打开标签对话框", async () => {
    const dialog = await ensureDialog();
    expect(dialog.document.getElementById(FILTER_INPUT_ID)).to.not.equal(null);
  });

  it("点击未选标签应切换为选中态样式", async () => {
    const dialog = await ensureDialog();
    const spans = Array.from(
      dialog.document.querySelectorAll("span[id^='categorial-tag-']"),
    ) as HTMLElement[];
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
    const event = new dialog.KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      bubbles: true,
      cancelable: true,
    });
    dialog.document.dispatchEvent(event);
    await waitUntil(() => !findDialogWindow(), "对话框关闭");
    expect(findDialogWindow()).to.equal(null);
  });
});
