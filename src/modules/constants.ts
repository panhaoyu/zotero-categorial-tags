import { config } from "../../package.json";

export const PrefDefault = {
  shortcut: "Ctrl+T",
} as const;

export const PrefKey = {
  shortcut: "shortcut",
} as const;

export const ElementID = {
  shortcutKeyInput: `#zotero-prefpane-${config.addonRef}-open-shortcut-key-input`,
  captureShortcutButton: `#zotero-prefpane-${config.addonRef}-capture-shortcut-button`,
} as const;

export const CommandKey = {
  openTagTab: "open-tag-tab",
} as const;

export type PrefKeyValue = (typeof PrefKey)[keyof typeof PrefKey];
