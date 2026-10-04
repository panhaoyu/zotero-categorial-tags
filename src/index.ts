import { BasicTool } from "zotero-plugin-toolkit";
import Addon from "./addon";
import { config } from "../package.json";

const basicTool = new BasicTool();

if (!getPluginGlobal()) {
  defineGlobal("window");
  defineGlobal("document");
  defineGlobal("ZoteroPane");
  defineGlobal("Zotero_Tabs");
  _globalThis.addon = new Addon();
  defineGlobal("ztoolkit", () => {
    return _globalThis.addon.data.ztoolkit;
  });
  setPluginGlobal(addon);
}

/**
 * 从全局 `Zotero` 对象读取插件实例。
 */
function getPluginGlobal(): Addon | undefined {
  const globals = Zotero as unknown as Record<string, unknown>;
  return globals[config.addonInstance] as Addon | undefined;
}

/**
 * 将插件实例挂载到全局 `Zotero` 对象。
 */
function setPluginGlobal(value: Addon): void {
  const globals = Zotero as unknown as Record<string, unknown>;
  globals[config.addonInstance] = value;
}

function defineGlobal(name: Parameters<BasicTool["getGlobal"]>[0]): void;
function defineGlobal(name: string, getter: () => unknown): void;
function defineGlobal(name: string, getter?: () => unknown) {
  Object.defineProperty(_globalThis, name, {
    get() {
      return getter ? getter() : basicTool.getGlobal(name);
    },
  });
}
