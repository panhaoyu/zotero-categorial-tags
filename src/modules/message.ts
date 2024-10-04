import { getString } from "../utils/locale";

export default class Message {
  static info(message: string) {
    const dialog = new ztoolkit.Dialog(1, 1);
    dialog.addCell(0, 0, {
      tag: "p",
      properties: {
        "innerText": message
      }
    });
    const title = getString("categorial-tags-message-dialog-title");
    dialog.open(title);
    dialog.addButton("OK");
  }
}