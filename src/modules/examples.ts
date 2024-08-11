import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import { Manager } from "./manager";
import type TagJson = _ZoteroTypes.Tags.TagJson;

function example(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;
  descriptor.value = function(...args: any) {
    try {
      ztoolkit.log(`Calling example ${target.name}.${String(propertyKey)}`);
      return original.apply(this, args);
    } catch (e) {
      ztoolkit.log(`Error in example ${target.name}.${String(propertyKey)}`, e);
      throw e;
    }
  };
  return descriptor;
}

export class BasicExampleFactory {
  @example
  static registerPrefs() {
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

export class KeyExampleFactory {

  static currentDialog: DialogHelper | undefined = undefined;
  static uiFactory: UIExampleFactory;

  @example
  static registerShortcuts() {
    ztoolkit.log("Shortcuts registered");
    ztoolkit.Keyboard.register((ev, keyOptions) => {
      ztoolkit.log("Key pressed");
      if (ev.type === "keyup" && ev.ctrlKey && (ev.key as string).toLowerCase() === "t") {
        ztoolkit.log("Ctrl+T Pressed");
        addon.hooks.onShortcuts("open-tag-tab");
      }
    });
  }

  static async closeCurrentDialog() {
    try {
      const dialog = KeyExampleFactory.currentDialog;
      if (dialog === undefined) return;
      dialog.window.close();
      KeyExampleFactory.currentDialog = undefined;
    } catch (e) {
    }
  }

  static async openTagsTabCallback() {
    await KeyExampleFactory.closeCurrentDialog();

    const selections = ZoteroPane.getSelectedItems();
    if (selections.length !== 1) {
      new ztoolkit.ProgressWindow("Tags manager only supports exactly 1 item").show();
      return;
    }

    const selection = selections[0];
    const mapping: {
      [key: string]: {
        tagName: string,
        activated: boolean,
        elementId: string,
        categoryName: string,
        tagJson: TagJson
        tagIndex: number
      }[]
    } = {};

    const allTags = await Zotero.Tags.getAll(ZoteroPane.getSelectedLibraryID());
    const categorialTagsList = KeyExampleFactory.uiFactory.getCategorialTagsOfList(allTags as TagJson[]);

    categorialTagsList.forEach((tagData, tagIndex) => {
      mapping[tagData.categoryName] ??= [];
      mapping[tagData.categoryName].push({
        categoryName: tagData.categoryName,
        tagIndex: tagIndex,
        tagJson: tagData.tagJson,
        tagName: tagData.tagName,
        activated: false,
        elementId: `tags-dialog-item-${selection.id}-tag-${tagIndex}`
      });
    });

    const categorialTagsOfItem = KeyExampleFactory.uiFactory.getCategorialTagsOfItem(selection);
    categorialTagsOfItem.forEach(tagData => {
      mapping[tagData.categoryName].find(v2 => v2.tagName === tagData.tagName)!.activated = true;
    });

    const tagsToChange: { [key in string]: boolean } = {};

    if (KeyExampleFactory.currentDialog !== undefined) {
      return;
    }

    const dialog = new ztoolkit.Dialog(2, 1);

    dialog.addCell(0, 0, {
      tag: "div",
      styles: {
        userSelect: "none"
      },
      children: [{
        tag: "table", children: [{
          tag: "tbody", children: Object.entries(mapping).map(([categoryName, tagsData]) => ({
            tag: "tr",
            styles: {
              marginBottom: "6px"
            },
            children: [
              { tag: "th", properties: { innerText: categoryName } },
              {
                tag: "td",
                styles: {
                  maxWidth: "800px"
                },
                children: tagsData.map(tagData => ({
                  tag: "span",
                  id: tagData.elementId,
                  properties: { innerText: tagData.tagName },
                  styles: {
                    marginLeft: "8px",
                    background: tagData.activated ? "#e5beff" : "#00000000",
                    whiteSpace: "nowrap",
                    cursor: "pointer"
                  },
                  listeners: [{
                    type: "click", listener: (evt: MouseEvent) => {
                      const tagString = tagData.tagName;
                      tagData.activated = !tagData.activated;
                      const element: HTMLSpanElement = dialog.window.document.querySelector(`#${tagData.elementId}`);
                      element.style.background = tagData.activated ? "#e5beff" : "#00000000";
                      tagsToChange[tagData.tagJson.tag] = tagData.activated;
                    }
                  }]
                }))
              }
            ]
          }))
        }]
      }]
    });

    dialog.addButton("Save and close", "save-button", {
      noClose: false, callback(ev) {
        Object.entries(tagsToChange).forEach(([tagName, activation]) => {
          if (activation) {
            selection.addTag(tagName);
          } else {
            selection.removeTag(tagName);
          }
          selection.save();
        });
      }
    });

    dialog.addButton("Cancel", "close-button", { noClose: false });

    dialog.open("Tags", { centerscreen: true, fitContent: true });
    KeyExampleFactory.currentDialog = dialog;

    dialog.window.addEventListener("keyup", (event) => {
      if (event.key.toLowerCase() === "escape") {
        KeyExampleFactory.closeCurrentDialog();
      }
    });
  }
}

export class UIExampleFactory {
  private readonly tagManager: Manager;

  constructor() {
    this.tagManager = new Manager();
  }

  async init() {
    // Initialize the Manager by updating its cache
    await this.tagManager.updateCache();
    this.registerExtraColumn();
  }

  getCategorialTagsOfList(tags: TagJson[]): { categoryName: string, tagName: string, tagJson: TagJson }[] {
    return tags
      .filter(tagJson => tagJson.tag.startsWith("#") && tagJson.tag.includes("/"))
      .map(tagJson => {
        const tagName = tagJson.tag;
        const removePrefix = tagName.slice(1);
        const [categoryName, tagNamePart] = removePrefix.split("/", 2);
        return {
          categoryName,
          tagName: tagNamePart,
          tagJson
        };
      })
      .sort((v1, v2) => v1.tagJson.tag > v2.tagJson.tag ? 1 : -1);
  }

  getCategorialTagsOfItem(item: Zotero.Item): { categoryName: string, tagName: string, tagJson: TagJson }[] {
    const tags = item.getTags() as TagJson[];
    return this.getCategorialTagsOfList(tags);
  }

  getCategorialTagsColumn(item: Zotero.Item): string {
    const categorialTags = this.getCategorialTagsOfItem(item);
    return categorialTags.map(i => i.tagName).join(" ");
  }

  registerExtraColumn() {
    Zotero.ItemTreeManager.registerColumns({
      pluginID: config.addonID,
      dataKey: "categorial-tags",
      label: getString("categorial-tags-column-name"),
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return this.getCategorialTagsColumn(item);
      }
    });
  }
}


export class HelperExampleFactory {
  @example
  static async dialogExample() {
    const dialogData: { [key: string | number]: any } = {
      inputValue: "test",
      checkboxValue: true,
      loadCallback: () => {
        ztoolkit.log(dialogData, "Dialog Opened!");
      },
      unloadCallback: () => {
        ztoolkit.log(dialogData, "Dialog closed!");
      }
    };
    const dialogHelper = new ztoolkit.Dialog(10, 2)
      .addCell(0, 0, {
        tag: "h1",
        properties: { innerHTML: "Helper Examples" }
      })
      .addCell(1, 0, {
        tag: "h2",
        properties: { innerHTML: "Dialog Data Binding" }
      })
      .addCell(2, 0, {
        tag: "p",
        properties: {
          innerHTML:
            "Elements with attribute 'data-bind' are binded to the prop under 'dialogData' with the same name."
        },
        styles: {
          width: "200px"
        }
      })
      .addCell(3, 0, {
        tag: "label",
        namespace: "html",
        attributes: {
          for: "dialog-checkbox"
        },
        properties: { innerHTML: "bind:checkbox" }
      })
      .addCell(
        3,
        1,
        {
          tag: "input",
          namespace: "html",
          id: "dialog-checkbox",
          attributes: {
            "data-bind": "checkboxValue",
            "data-prop": "checked",
            type: "checkbox"
          },
          properties: { label: "Cell 1,0" }
        },
        false
      )
      .addCell(4, 0, {
        tag: "label",
        namespace: "html",
        attributes: {
          for: "dialog-input"
        },
        properties: { innerHTML: "bind:input" }
      })
      .addCell(
        4,
        1,
        {
          tag: "input",
          namespace: "html",
          id: "dialog-input",
          attributes: {
            "data-bind": "inputValue",
            "data-prop": "value",
            type: "text"
          }
        },
        false
      )
      .addCell(5, 0, {
        tag: "h2",
        properties: { innerHTML: "Toolkit Helper Examples" }
      })
      .addCell(
        6,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button"
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                addon.hooks.onDialogEvents("clipboardExample");
              }
            }
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px"
              },
              properties: {
                innerHTML: "example:clipboard"
              }
            }
          ]
        },
        false
      )
      .addCell(
        7,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button"
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                addon.hooks.onDialogEvents("filePickerExample");
              }
            }
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px"
              },
              properties: {
                innerHTML: "example:filepicker"
              }
            }
          ]
        },
        false
      )
      .addCell(
        8,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button"
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                addon.hooks.onDialogEvents("progressWindowExample");
              }
            }
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px"
              },
              properties: {
                innerHTML: "example:progressWindow"
              }
            }
          ]
        },
        false
      )
      .addCell(
        9,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button"
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                addon.hooks.onDialogEvents("vtableExample");
              }
            }
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px"
              },
              properties: {
                innerHTML: "example:virtualized-table"
              }
            }
          ]
        },
        false
      )
      .addButton("Confirm", "confirm")
      .addButton("Cancel", "cancel")
      .addButton("Help", "help", {
        noClose: true,
        callback: (e) => {
          dialogHelper.window?.alert(
            "Help Clicked! Dialog will not be closed."
          );
        }
      })
      .setDialogData(dialogData)
      .open("Dialog Example");
    addon.data.dialog = dialogHelper;
    await dialogData.unloadLock.promise;
    addon.data.dialog = undefined;
    addon.data.alive &&
    ztoolkit.getGlobal("alert")(
      `Close dialog with ${dialogData._lastButtonId}.\nCheckbox: ${dialogData.checkboxValue}\nInput: ${dialogData.inputValue}.`
    );
    ztoolkit.log(dialogData);
  }

  @example
  static clipboardExample() {
    new ztoolkit.Clipboard()
      .addText(
        "![Plugin Template](https://github.com/panhaoyu/zotero-categorial-tags)",
        "text/unicode"
      )
      .addText(
        "<a href=\"https://github.com/panhaoyu/zotero-categorial-tags\">Plugin Template</a>",
        "text/html"
      )
      .copy();
    ztoolkit.getGlobal("alert")("Copied!");
  }

  @example
  static async filePickerExample() {
    const path = await new ztoolkit.FilePicker(
      "Import File",
      "open",
      [
        ["PNG File(*.png)", "*.png"],
        ["Any", "*.*"]
      ],
      "image.png"
    ).open();
    ztoolkit.getGlobal("alert")(`Selected ${path}`);
  }

  @example
  static progressWindowExample() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "ProgressWindow Example!",
        type: "success",
        progress: 100
      })
      .show();
  }

  @example
  static vtableExample() {
    ztoolkit.getGlobal("alert")("See src/modules/preferenceScript.ts");
  }
}
