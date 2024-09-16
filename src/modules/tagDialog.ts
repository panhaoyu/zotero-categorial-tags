// 导入必要的模块和类型
import { tagManager } from "./manager"; // 导入标签管理器，用于获取和管理所有标签
import { getString } from "../utils/locale"; // 导入本地化字符串获取工具
import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog"; // 导入 DialogHelper 类，用于创建和管理对话框
import { CategorialTag } from "./categorialTag"; // 导入 CategorialTag 类型，用于表示分类标签


// 定义 TagState 接口，表示每个标签的状态
interface TagState {
  changed: boolean; // 标记该标签是否被修改过
  active: boolean;  // 标记该标签是否处于激活状态
}

// 定义 DialogData 接口，用于存储对话框中的数据
interface DialogData {
  itemTags: { [key: number]: TagState }; // 存储每个标签的状态，键为标签ID
}

// 导出 TagDialog 类，用于管理标签对话框的创建、显示和交互
export class TagDialog {
  private dialog?: DialogHelper; // 对话框实例，可选
  private itemTags: { [key: number]: TagState }; // 存储所有标签的状态
  private selections: Zotero.Item[]; // 被选中的项数组
  private dialogTitle: string; // 对话框标题

  /**
   * 构造函数
   * @param selections 被选中的项数组
   */
  constructor(selections: Zotero.Item[]) {
    this.selections = selections; // 初始化被选中的项
    this.itemTags = {}; // 初始化标签状态为空对象
    this.dialogTitle = ""; // 初始化对话框标题为空字符串

    // 初始化 itemTags 和 dialogTitle
    this.initialize();
  }

  /**
   * 初始化方法
   * - 计算所有选中项共有的标签
   * - 设置对话框标题
   * - 初始化 itemTags，根据共有标签设置激活状态
   */
  private initialize() {
    // 如果没有任何选中的项，抛出错误
    if (this.selections.length === 0) {
      throw new Error("No selections provided");
    }

    // 获取第一个选中项的所有标签
    const initialTags = this.selections[0].getTags().map(tagObj => tagObj.tag);

    // 计算所有选中项共有的标签
    const commonTags = this.selections.slice(1).reduce((acc, selection) => {
      const selectionTags = selection.getTags().map(tagObj => tagObj.tag); // 获取当前选中项的标签
      return acc.filter(tag => selectionTags.includes(tag)); // 过滤出在当前选中项中也存在的标签
    }, initialTags); // 初始值为第一个选中项的标签

    // 根据选中项的数量设置对话框标题
    const selectionItemsTitle =
      this.selections.length === 1
        ? this.selections[0].getDisplayTitle() // 如果只有一个选中项，使用其显示标题
        : getString(`categorial-tags-selection-titles`, { args: { length: this.selections.length } }); // 否则，使用本地化字符串显示选中项数量
    this.dialogTitle = getString("categorial-tags-dialog-title", { args: { selectionTitles: selectionItemsTitle } }); // 设置最终的对话框标题

    // 初始化 itemTags，根据 commonTags 设置每个标签的激活状态
    this.itemTags = Object.fromEntries(
      tagManager.getAllTags().map(i => [
        i.tagId, // 标签ID作为键
        {
          changed: false, // 初始化为未修改状态
          active: commonTags.includes(i.fullName) // 如果标签在共有标签中，则设置为激活状态
        }
      ])
    );
  }

  /**
   * 打开对话框方法
   * - 创建对话框实例
   * - 设置对话框的数据
   * - 构建对话框的UI内容
   * - 添加保存和取消按钮
   * - 打开对话框并设置事件监听
   */
  public open() {
    // 如果对话框已经存在，直接返回，避免重复创建
    if (this.dialog !== undefined) return;

    // 创建一个新的 DialogHelper 实例，指定行数和列数（这里为2行1列）
    this.dialog = new DialogHelper(2, 1);

    // 设置对话框的数据，将初始化好的 itemTags 复制到 dialogData 中
    const dialogData: DialogData = {
      itemTags: { ...this.itemTags } // 使用展开运算符复制 itemTags
    };
    this.dialog.setDialogData(dialogData); // 将 dialogData 设置到对话框中

    // 构建对话框的内容，添加到指定的单元格位置（0,0）
    this.dialog.addCell(0, 0, {
      tag: "div", // 使用 div 作为容器
      styles: {
        userSelect: "none", // 禁止用户选择文本
        maxHeight: "800px", // 设置最大高度
        overflowY: "auto" // 超出部分自动出现滚动条
      },
      children: [
        {
          tag: "table", // 使用表格布局
          children: [
            {
              tag: "tbody", // 表格主体
              children: tagManager.getAllCategories().map(category => ({
                tag: "tr", // 每个分类对应一行
                styles: {
                  marginBottom: "6px" // 每行底部留出6px的间距
                },
                children: [
                  { tag: "th", properties: { innerText: category.name } }, // 表头显示分类名称
                  {
                    tag: "td", // 表格单元格
                    styles: {
                      maxWidth: "800px" // 设置最大宽度
                    },
                    children: category.tags.map((tagData: CategorialTag) => ({
                      tag: "span", // 使用 span 显示每个标签
                      id: tagData.uniqueElementId, // 设置唯一的元素ID，便于后续查询
                      properties: { innerText: tagData.tagName }, // 设置标签的显示名称
                      styles: {
                        marginLeft: "8px", // 左边距8px
                        background: dialogData.itemTags[tagData.tagId].active
                          ? "#e5beff" // 如果标签处于激活状态，设置背景色
                          : "transparent", // 否则背景透明
                        whiteSpace: "nowrap", // 禁止换行
                        cursor: "pointer", // 鼠标悬停时显示为手型
                        padding: "4px", // 内边距4px
                        borderRadius: "4px", // 边角圆润4px
                        display: "inline-block" // 显示为行内块元素
                      },
                      listeners: [
                        {
                          type: "click", // 监听点击事件
                          listener: () => {
                            this.toggleTag(tagData.tagId, tagData.uniqueElementId); // 点击时调用 toggleTag 方法切换标签状态
                          }
                        }
                      ]
                    }))
                  }
                ]
              }))
            }
          ]
        }
      ]
    });

    // 添加“保存并关闭”按钮
    this.dialog.addButton("Save and close", "save-button", {
      noClose: false, // 点击按钮后不自动关闭对话框
      callback: () => { // 按钮点击回调函数
        this.saveChanges(); // 保存更改
        this.close(); // 关闭对话框
      }
    });

    // 添加“取消”按钮
    this.dialog.addButton("Cancel", "close-button", {
      noClose: false, // 点击按钮后不自动关闭对话框
      callback: () => this.close() // 按钮点击回调函数，关闭对话框
    });

    // 打开对话框，设置标题和窗口特性
    this.dialog.open(this.dialogTitle, {
      centerscreen: true, // 窗口居中显示
      fitContent: true // 根据内容自动调整窗口大小
    });

    // 监听键盘事件，按下 Esc 键时关闭对话框
    this.dialog.window.addEventListener("keyup", event => {
      if (event.key.toLowerCase() === "escape") { // 判断按下的键是否为 Esc
        this.close(); // 关闭对话框
      }
    });
  }

  /**
   * 关闭对话框方法
   * - 关闭对话框窗口
   * - 将 dialog 属性设为 undefined，表示对话框已关闭
   */
  public close() {
    if (this.dialog === undefined) return; // 如果对话框不存在，直接返回
    this.dialog.window.close(); // 关闭对话框窗口
    this.dialog = undefined; // 将 dialog 属性设为 undefined
  }

  /**
   * 切换标签状态的方法
   * @param tagId 标签的ID
   * @param elementId 标签对应的DOM元素的唯一ID
   *
   * 该方法用于切换指定标签的激活状态，并更新对应的UI样式
   */
  private toggleTag(tagId: number, elementId: string) {
    if (!this.dialog) return; // 如果对话框不存在，直接返回

    const tagState = this.dialog.dialogData.itemTags[tagId]; // 获取对应标签的状态
    if (tagState) {
      tagState.active = !tagState.active; // 切换激活状态
      tagState.changed = true; // 标记该标签已被修改

      // 手动更新 DOM 元素的背景颜色
      const element: HTMLSpanElement | null = this.dialog.window.document.querySelector(`#${elementId}`); // 通过ID查询对应的DOM元素
      if (element) {
        element.style.background = tagState.active ? "#e5beff" : "transparent"; // 根据激活状态设置背景颜色
      }
    }
  }

  /**
   * 保存更改的方法
   *
   * 该方法遍历所有标签状态，根据修改情况将标签添加或移除到选中的项中，并保存更改
   */
  private saveChanges() {
    if (!this.dialog) return; // 如果对话框不存在，直接返回

    const itemTags: { [key: number]: TagState } = this.dialog.dialogData.itemTags; // 获取当前对话框中的标签状态
    Object.entries(itemTags).forEach(([tagId, activeData]) => { // 遍历所有标签状态
      if (!activeData.changed) return; // 如果标签状态未被修改，跳过
      const tag = tagManager.getTag(Number(tagId)); // 获取标签的详细信息
      if (tag === undefined) return; // 如果标签不存在，跳过
      this.selections.forEach(selection => { // 遍历所有选中的项
        if (activeData.active) { // 如果标签处于激活状态
          selection.addTag(tag.fullName); // 将标签添加到选中项中
        } else { // 如果标签处于非激活状态
          selection.removeTag(tag.fullName); // 从选中项中移除标签
        }
        selection.save(); // 保存选中项的更改
      });
    });
  }
}
