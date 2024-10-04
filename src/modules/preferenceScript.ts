import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { setPref } from "../utils/prefs";

export async function registerPrefsScripts(_window: Window) {
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
      columns: [
        {
          dataKey: "title",
          label: getString("prefs-table-title"),
          fixedWidth: true,
          width: 100
        },
        {
          dataKey: "detail",
          label: getString("prefs-table-detail")
        }
      ]
    };
  } else {
    addon.data.prefs.window = _window;
  }
  updatePrefsUI();
  bindPrefEvents();
}

async function updatePrefsUI() {
  const renderLock = ztoolkit.getGlobal("Zotero").Promise.defer();
  if (addon.data.prefs?.window == undefined) return;
  await renderLock.promise;
  ztoolkit.log("Preference table rendered!");
}

function bindPrefEvents() {
  addon.data
    .prefs!.window.document.querySelector(
    `#zotero-prefpane-${config.addonRef}-enable`
  )
    ?.addEventListener("command", (e) => {
      setPref("enable-title", (e.target as XUL.Checkbox).checked);
    });
}
