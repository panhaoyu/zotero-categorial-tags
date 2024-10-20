import { getString } from "../utils/locale";

enum MessageType {
  Info = "info",
  Warning = "warning",
  Error = "error"
}

export default class Message {
  static info(message: string) {
    this.showMessage(message, MessageType.Info);
  }

  static warning(message: string) {
    this.showMessage(message, MessageType.Warning);
  }

  static error(message: string) {
    this.showMessage(message, MessageType.Error);
  }

  private static showMessage(message: string, type: MessageType) {
    switch (type) {
      case MessageType.Error:
        message = `${message}<br/>Please open an issue on GitHub.`;
        break;
      default:
        break;
    }

    const dialog = new ztoolkit.Dialog(1, 1);
    dialog.addCell(0, 0, {
      tag: "span",
      properties: {
        innerHTML: message
      }
    });

    let titleKey: string;
    switch (type) {
      case MessageType.Warning:
        titleKey = "categorial-tags-dialog-title-warning";
        break;
      case MessageType.Error:
        titleKey = "categorial-tags-dialog-title-error";
        break;
      default:
        titleKey = "categorial-tags-dialog-title-info";
        break;
    }

    const title = getString(titleKey);
    dialog.open(title);
    dialog.addButton("OK");
  }
}
