import { getString } from "../utils/locale";

enum MessageType {
  Info = "info",
  Warning = "warning",
  Error = "error",
}

export default class Message {
  static info(message: string): void {
    this.showMessage(message, MessageType.Info);
  }

  static warning(message: string): void {
    this.showMessage(message, MessageType.Warning);
  }

  static error(message: string): void {
    this.showMessage(message, MessageType.Error);
  }

  private static showMessage(message: string, type: MessageType): void {
    if (type === MessageType.Error) {
      message = `${message}<br/>This plugin is developed with AIGC. If the problem persists, please open an issue on GitHub.`;
    }

    const dialog = new ztoolkit.Dialog(1, 1);
    dialog.addCell(0, 0, {
      tag: "span",
      properties: {
        innerHTML: message,
      },
    });

    const titleKey =
      type === MessageType.Warning
        ? "categorial-tags-dialog-title-warning"
        : type === MessageType.Error
          ? "categorial-tags-dialog-title-error"
          : "categorial-tags-dialog-title-info";

    dialog.open(getString(titleKey));
    dialog.addButton("OK");
  }
}
