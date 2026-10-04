import { config } from "../../package.json";

/**
 * 本插件的偏好键类型，由 `zotero-plugin-scaffold` 生成到 `typings/prefs.d.ts`。
 */
export type PluginPrefsMap = _ZoteroTypes.Prefs["PluginPrefsMap"];

/**
 * 读取偏好值。
 * `Zotero.Prefs.get` 的封装。
 * @param key 偏好键
 */
export function getPref<K extends keyof PluginPrefsMap>(
  key: K,
): PluginPrefsMap[K] | undefined {
  return Zotero.Prefs.get(`${config.prefsPrefix}.${String(key)}`, true) as
    PluginPrefsMap[K] | undefined;
}

/**
 * 写入偏好值。
 * `Zotero.Prefs.set` 的封装。
 * @param key 偏好键
 * @param value 偏好值
 */
export function setPref<K extends keyof PluginPrefsMap>(
  key: K,
  value: PluginPrefsMap[K],
): void {
  Zotero.Prefs.set(`${config.prefsPrefix}.${String(key)}`, value, true);
}

/**
 * 清除偏好值。
 * `Zotero.Prefs.clear` 的封装。
 * @param key 偏好键
 */
export function clearPref(key: keyof PluginPrefsMap): void {
  Zotero.Prefs.clear(`${config.prefsPrefix}.${String(key)}`, true);
}
