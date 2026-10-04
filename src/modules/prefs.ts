import { config } from "../../package.json";
import { getString } from "../utils/locale";

/**
 * 注册插件偏好设置面板。
 */
class PreferencesManager {
  async register(): Promise<void> {
    const prefOptions: _ZoteroTypes._PreferencePaneOption = {
      pluginID: config.addonID,
      src: `${rootURI}chrome/content/preferences.xhtml`,
      label: getString("prefs-title"),
      image: `chrome://${config.addonRef}/content/icons/favicon.png`,
      defaultXUL: true,
    };
    await Zotero.PreferencePanes.register(prefOptions);
  }
}

export const preferenceManager = new PreferencesManager();
