import { ZoteroToolkit } from "zotero-plugin-toolkit";
import AddonClass from "../src/addon";

declare global {
  const _globalThis: {
    [key: string]: any;
    Zotero: _ZoteroTypes.Zotero;
    ZoteroPane: _ZoteroTypes.ZoteroPane;
    Zotero_Tabs: typeof Zotero_Tabs;
    window: Window;
    document: Document;
    ztoolkit: CustomZoteroToolkit;
    addon: AddonClass;
  };

  const addon: AddonClass;

  class CustomZoteroToolkit extends ZoteroToolkit {
    log(...message: string[]);
  }

  const ztoolkit: CustomZoteroToolkit;

  const rootURI: string;

  const addon: Addon;

  const __env__: "production" | "development";

  class Localization {
  }
}
