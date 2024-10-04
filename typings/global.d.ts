import { ZoteroToolkit } from "zotero-plugin-toolkit";
import Addon from "../src/addon";

declare global {
  const _globalThis: {
    [key: string]: any;
    Zotero: _ZoteroTypes.Zotero;
    ZoteroPane: _ZoteroTypes.ZoteroPane;
    Zotero_Tabs: typeof Zotero_Tabs;
    window: Window;
    document: Document;
    ztoolkit: ZToolkit;
    addon: Addon;
  };


  class ZToolkit extends ZoteroToolkit {
    log(...message: string[]);
  }

  const ztoolkit: ZToolkit;

  const rootURI: string;

  const addon: Addon;

  const __env__: "production" | "development";

  class Localization {
  }
}
