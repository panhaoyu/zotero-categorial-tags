/**
 * 键盘快捷键的解析结果。
 */
export interface KeyOptions {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string | null;
}

/**
 * 将 `Ctrl+Shift+T` 之类的快捷键字符串解析为键位配置。
 */
export function parseShortcut(shortcut: string): KeyOptions {
  const keys = shortcut
    .toLowerCase()
    .split("+")
    .map((key) => key.trim());

  const keyOptions: KeyOptions = {
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    key: null,
  };

  for (const key of keys) {
    switch (key) {
      case "ctrl":
      case "control":
        keyOptions.ctrl = true;
        break;
      case "shift":
        keyOptions.shift = true;
        break;
      case "alt":
        keyOptions.alt = true;
        break;
      case "meta":
      case "command":
      case "cmd":
        keyOptions.meta = true;
        break;
      default:
        if (key) {
          keyOptions.key = key;
        }
    }
  }

  return keyOptions;
}
