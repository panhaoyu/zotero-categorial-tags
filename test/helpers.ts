/**
 * 集成测试共享工具。
 */

export const PLUGIN_INSTANCE = "CategorialTags";
export const FILTER_INPUT_ID = "zotero-categorial-tags-filter-input";
export const CAPTURE_INPUT_ID = "shortcut-capture-input";

/** 标签对话框中已激活标签的背景色（与 tagDialogUI 中一致）。 */
export const ACTIVE_ITEM_BG = "rgb(239, 210, 255)";
/** 标签对话框中筛选命中的背景色（与 tagDialogUI 中一致）。 */
export const FILTERED_ITEM_BG = "rgb(181, 241, 196)";

export interface AddonLike {
  data: {
    alive: boolean;
    ztoolkit?: {
      Keyboard?: {
        _keyboardCallbacks?: { size: number };
      };
    };
    locale?: {
      current?: {
        formatMessagesSync: (
          messages: Array<{ id: string }>,
        ) => Array<{ value?: string } | undefined>;
      };
    };
  };
  hooks?: {
    onShortcuts?: (type: string) => void;
  };
}

export function getAddon(): AddonLike | undefined {
  const globals = Zotero as unknown as Record<string, unknown>;
  return globals[PLUGIN_INSTANCE] as AddonLike | undefined;
}

export function delay(ms: number): Promise<void> {
  return Zotero.Promise.delay(ms);
}

export async function waitUntil(
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

export async function waitForPlugin(): Promise<void> {
  await waitUntil(
    () => !!getAddon()?.data?.ztoolkit?.Keyboard?._keyboardCallbacks?.size,
    "插件初始化（快捷键注册）",
  );
}

export function getWindowTitles(): string[] {
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

export function findWindowByElementId(elementId: string): Window | null {
  const wm = Services.wm.getEnumerator(null as unknown as string);
  while (wm.hasMoreElements()) {
    const win = wm.getNext() as unknown as Window;
    try {
      // 通过窗口内元素的 id 识别，避免依赖界面语言
      if (win.document?.getElementById(elementId)) {
        return win;
      }
    } catch {
      // 忽略无法访问的窗口
    }
  }
  return null;
}

export function findWindowByTitle(titlePart: string): Window | null {
  const wm = Services.wm.getEnumerator(null as unknown as string);
  while (wm.hasMoreElements()) {
    const win = wm.getNext() as unknown as Window;
    try {
      if (win.document?.title?.includes(titlePart)) {
        return win;
      }
    } catch {
      // 忽略无法访问的窗口
    }
  }
  return null;
}

export function findDialogWindow(): Window | null {
  return findWindowByElementId(FILTER_INPUT_ID);
}

export function findCaptureDialogWindow(): Window | null {
  return findWindowByElementId(CAPTURE_INPUT_ID);
}

export interface KeyboardEventWindow extends Window {
  KeyboardEvent: new (type: string, init?: KeyboardEventInit) => KeyboardEvent;
}

export function makeKeyEvent(
  target: Window,
  init: KeyboardEventInit,
): KeyboardEvent {
  const ctor = (target as KeyboardEventWindow).KeyboardEvent;
  return new ctor("keydown", init);
}

/** 向窗口派发 keydown 事件（适用于监听器注册在 window 上的场景）。 */
export function pressKey(win: Window, init: KeyboardEventInit): void {
  win.dispatchEvent(makeKeyEvent(win, init));
}

/** 向文档派发 keydown 事件（适用于监听器注册在 document 上的场景）。 */
export function pressKeyOnDocument(win: Window, init: KeyboardEventInit): void {
  win.document.dispatchEvent(makeKeyEvent(win, init));
}

/** 模拟按下插件的全局快捷键（默认 Ctrl+T）。 */
export function pressShortcut(): void {
  pressKey(Zotero.getMainWindow(), {
    key: "t",
    code: "KeyT",
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
  });
}

export function getDiagnostics(): string {
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

/** 确保标签对话框已打开（必要时模拟快捷键），并等待初始化完成。 */
export async function ensureDialog(): Promise<Window> {
  // 先彻底关闭旧对话框，避免复用正在关闭的窗口
  await closeAllDialogs();

  pressShortcut();
  try {
    await waitUntil(() => !!findDialogWindow(), "标签对话框打开", 3000);
  } catch {
    // 键盘分发未生效时，直接调用插件回调做二分诊断
    void getAddon()?.hooks?.onShortcuts?.("open-tag-tab");
    await delay(1500);
    if (!findDialogWindow()) {
      throw new Error(`诊断：${getDiagnostics()}`);
    }
  }

  // 等待对话框完成初始化（open() 内部延迟 300ms 后才注册键盘监听）
  await delay(600);
  const dialog = findDialogWindow();
  if (!dialog) {
    throw new Error("对话框在初始化期间被关闭");
  }
  return dialog;
}

export async function closeAllDialogs(): Promise<void> {
  // 逐个关闭并等待窗口真正销毁，避免在“正在关闭”状态下重复触发关闭
  for (let i = 0; i < 3; i++) {
    const dialog = findDialogWindow();
    if (!dialog) return;

    // 首次尝试：点击“取消”按钮，走插件的关闭流程
    const cancel = dialog.document.getElementById(
      "close-button",
    ) as HTMLElement | null;
    if (cancel) {
      cancel.click();
    } else {
      dialog.close();
    }
    const closed = await waitUntil(
      () => !findDialogWindow(),
      "对话框关闭",
      5000,
    )
      .then(() => true)
      .catch(() => false);
    if (closed) return;

    // 兜底：直接关闭窗口（若实例已置空，按钮路径会 no-op）
    findDialogWindow()?.close();
    const closedFallback = await waitUntil(
      () => !findDialogWindow(),
      "对话框关闭（兜底）",
      5000,
    )
      .then(() => true)
      .catch(() => false);
    if (closedFallback) return;
  }
}

export function getDialogSpans(dialog: Window): HTMLElement[] {
  return Array.from(
    dialog.document.querySelectorAll("span[id^='categorial-tag-']"),
  ) as HTMLElement[];
}

/** 创建带有指定分类标签的条目。 */
export async function createItemWithTags(
  title: string,
  tags: string[],
): Promise<Zotero.Item> {
  const item = new Zotero.Item("book");
  item.setField("title", title);
  await item.saveTx();
  for (const tag of tags) {
    item.addTag(tag);
  }
  await item.saveTx();
  return item;
}

/** 选中条目并等待选中状态生效。 */
export async function selectItem(item: Zotero.Item): Promise<void> {
  const pane = Zotero.getActiveZoteroPane();
  if (!pane) throw new Error("找不到活动的 Zotero 面板");
  pane.selectItem(item.id, true);
  await waitUntil(
    () => pane.getSelectedItems().some((selected) => selected.id === item.id),
    "条目选中",
  );
}

/** 清空条目选中状态。 */
export async function clearSelection(): Promise<void> {
  const pane = Zotero.getActiveZoteroPane();
  if (!pane) throw new Error("找不到活动的 Zotero 面板");
  const p = pane as unknown as {
    clearSelection?: () => void;
    selectItems: (ids: number[], inLibraryRoot?: boolean) => Promise<unknown>;
    itemsView?: { selection?: { clearSelection?: () => void } };
  };

  // 依次尝试多种清空方式，直到选中为空
  p.itemsView?.selection?.clearSelection?.();
  await delay(200);
  if (pane.getSelectedItems().length > 0) {
    p.clearSelection?.();
    await delay(200);
  }
  if (pane.getSelectedItems().length > 0) {
    await p.selectItems([]);
    await delay(200);
  }

  await waitUntil(
    () => pane.getSelectedItems().length === 0,
    `清空选中（剩余 ${pane
      .getSelectedItems()
      .map((selected) => selected.id)
      .join(",")}）`,
  );
}
