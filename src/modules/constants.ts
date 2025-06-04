import { config } from "../../package.json";

export const PrefDefault = {
  shortcut: "Ctrl+T"
};
export const PrefKey = {
  shortcut: "shortcut"
};
export const ElementID = {
  shortcutKeyInput: `#zotero-prefpane-${config.addonRef}-open-shortcut-key-input`,
  captureShortcutButton: `#zotero-prefpane-${config.addonRef}-capture-shortcut-button`
};
export const CommandKey = {
  openTagTab: "open-tag-tab"
};