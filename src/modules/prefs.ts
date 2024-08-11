import { config } from "../../package.json";
import { getString } from "../utils/locale";

export class PreferencesManager {
  init() {
    const prefOptions = {
      pluginID: config.addonID,
      src: rootURI + "chrome/content/preferences.xhtml",
      label: getString("prefs-title"),
      image: `chrome://${config.addonRef}/content/icons/favicon.png`,
      defaultXUL: true
    };
    ztoolkit.PreferencePane.register(prefOptions);
  }
}