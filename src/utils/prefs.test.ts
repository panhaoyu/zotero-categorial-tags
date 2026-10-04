import { clearPref, getPref, setPref } from "./prefs";

interface PrefsMock {
  get: jest.Mock;
  set: jest.Mock;
  clear: jest.Mock;
}

const store = new Map<string, unknown>();

const prefsMock: PrefsMock = {
  get: jest.fn((key: string) => store.get(key)),
  set: jest.fn((key: string, value: unknown) => {
    store.set(key, value);
  }),
  clear: jest.fn((key: string) => {
    store.delete(key);
  }),
};

(globalThis as unknown as { Zotero: { Prefs: PrefsMock } }).Zotero = {
  Prefs: prefsMock,
};

const FULL_KEY = "extensions.zotero.categorialtags.shortcut";

describe("prefs", () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  test("setPref 应写入带前缀的完整键", () => {
    setPref("shortcut", "Ctrl+K");
    expect(store.get(FULL_KEY)).toBe("Ctrl+K");
    expect(prefsMock.set).toHaveBeenCalledWith(FULL_KEY, "Ctrl+K", true);
  });

  test("getPref 应读取带前缀的完整键", () => {
    store.set(FULL_KEY, "Ctrl+K");
    expect(getPref("shortcut")).toBe("Ctrl+K");
    expect(prefsMock.get).toHaveBeenCalledWith(FULL_KEY, true);
  });

  test("getPref 未设置时应返回 undefined", () => {
    expect(getPref("shortcut")).toBeUndefined();
  });

  test("clearPref 应删除带前缀的完整键", () => {
    setPref("shortcut", "Ctrl+K");
    clearPref("shortcut");
    expect(store.has(FULL_KEY)).toBe(false);
    expect(prefsMock.clear).toHaveBeenCalledWith(FULL_KEY, true);
  });

  test("setPref 应原样传递字符串值", () => {
    setPref("shortcut", "Alt+P");
    expect(prefsMock.set).toHaveBeenCalledWith(FULL_KEY, "Alt+P", true);
  });
});
