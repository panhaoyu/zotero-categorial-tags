import { parseShortcut } from "./shortcutParser";

describe("parseShortcut", () => {
  test("应解析单个修饰键与主键", () => {
    expect(parseShortcut("Ctrl+T")).toEqual({
      ctrl: true,
      shift: false,
      alt: false,
      meta: false,
      key: "t",
    });
  });

  test("应解析多个修饰键组合", () => {
    expect(parseShortcut("Ctrl+Shift+Alt+T")).toEqual({
      ctrl: true,
      shift: true,
      alt: true,
      meta: false,
      key: "t",
    });
  });

  test("应忽略大小写与空白", () => {
    expect(parseShortcut(" ctrl + SHIFT + t ")).toEqual({
      ctrl: true,
      shift: true,
      alt: false,
      meta: false,
      key: "t",
    });
  });

  test("command / cmd 应视为 meta 修饰键", () => {
    for (const modifier of ["Meta", "Command", "Cmd"]) {
      expect(parseShortcut(`${modifier}+K`).meta).toBe(true);
    }
  });

  test("control 应视为 ctrl 修饰键", () => {
    expect(parseShortcut("Control+K").ctrl).toBe(true);
  });

  test("功能键应保持原样并小写化", () => {
    expect(parseShortcut("Alt+F4").key).toBe("f4");
    expect(parseShortcut("Ctrl+Delete").key).toBe("delete");
  });

  test("仅主键时应无修饰键", () => {
    expect(parseShortcut("F5")).toEqual({
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
      key: "f5",
    });
  });

  test("空字符串应得到空键位", () => {
    expect(parseShortcut("")).toEqual({
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
      key: null,
    });
  });

  test("尾随 + 不应产生空主键", () => {
    expect(parseShortcut("Ctrl+").key).toBeNull();
  });

  test("连字符可作为主键", () => {
    expect(parseShortcut("Ctrl+-").key).toBe("-");
  });

  test("重复修饰键不应报错", () => {
    expect(parseShortcut("Ctrl+Ctrl+T")).toEqual({
      ctrl: true,
      shift: false,
      alt: false,
      meta: false,
      key: "t",
    });
  });
});
