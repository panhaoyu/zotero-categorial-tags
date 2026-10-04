import { BasicTool } from "zotero-plugin-toolkit";
import { ZoteroToolkit } from "zotero-plugin-toolkit/ztoolkit";
import { config } from "../../package.json";

BasicTool.prototype.log = (..._message: unknown[]): void => {};

export { createZToolkit };

function createZToolkit(): ZoteroToolkit {
  const _ztoolkit = new ZoteroToolkit();
  /**
   * 或者按需引入所用工具模块以减小插件体积：
   * 在下方 `MyToolkit` 类中添加所需模块，并取消注释下一行。
   */
  // const _ztoolkit = new MyToolkit();
  initZToolkit(_ztoolkit);
  return _ztoolkit;
}

function initZToolkit(_ztoolkit: ZoteroToolkit): void {
  const env = __env__;
  _ztoolkit.basicOptions.log.prefix = `[${config.addonName}]`;
  _ztoolkit.basicOptions.log.disableConsole = env === "production";
  _ztoolkit.UI.basicOptions.ui.enableElementJSONLog = env === "development";
  _ztoolkit.UI.basicOptions.ui.enableElementDOMLog = env === "development";
  _ztoolkit.basicOptions.api.pluginID = config.addonID;
  _ztoolkit.ProgressWindow.setIconURI(
    "default",
    `chrome://${config.addonRef}/content/icons/favicon.png`,
  );
}
