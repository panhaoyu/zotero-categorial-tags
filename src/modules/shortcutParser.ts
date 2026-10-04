/**
 * Parsed representation of a keyboard shortcut.
 */
export interface KeyOptions {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string | null;
}

/**
 * Parse a shortcut string such as `Ctrl+Shift+T` into its key options.
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
