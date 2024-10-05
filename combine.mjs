// 这个脚本的意义和用法：
// 该脚本的目的是将指定目录中所有相关的 TypeScript (.ts)、CSS (.css)、以及 XHTML (.xhtml) 文件内容进行合并，并将合并后的内容复制到剪贴板中。
// 这样可以方便地将所有实现插件功能的代码片段合并为一个文件，以便于大语言模型的输入或者其他分析用途。
// 用法：
// 1. 确保你已经安装了必要的依赖项，可以通过运行 `yarn add glob clipboardy` 安装。
// 2. 修改 `projectRoot` 为你的项目根目录路径。
// 3. 运行该脚本，所有匹配到的文件内容将被合并，并复制到剪贴板中，供你随时粘贴使用。

// 安装必要的依赖项：
// yarn add glob clipboardy

import fs from "fs";
import path from "path";
import { sync as globSync } from "glob";
import clipboardy from "clipboardy";

// 项目的根目录
const projectRoot = "F:/projects/zotero-categorial-tags";

// 要包含的文件模式
const patterns = [
  "**/*.ts",
  "**/*.css",
  "**/*.xhtml",
  "**/*.ftl"
];

// 要排除的目录
const excludeDirs = [
  "node_modules",
  "build",
  "data",
  "doc",
  ".github"
];

// 根据模式获取所有相关文件
function getAllFiles() {
  let files = [];
  patterns.forEach((pattern) => {
    const options = {
      cwd: projectRoot,
      absolute: true,
      ignore: excludeDirs.map((dir) => `${dir}/**`)
    };
    files = files.concat(globSync(pattern, options));
  });
  return files;
}

// 读取所有文件内容并合并
function readAndMergeFiles(files) {
  let mergedContent = "";
  files.forEach((file) => {
    try {
      const content = fs.readFileSync(file, "utf-8");
      mergedContent += `\n\n/* --- File: ${path.relative(projectRoot, file)} --- */\n`;
      mergedContent += content;
    } catch (err) {
      console.error(`Error reading file: ${file}`, err);
    }
  });
  return mergedContent;
}

// 主函数
async function main() {
  const files = getAllFiles();
  if (files.length === 0) {
    console.log("No files found matching the specified patterns.");
    return;
  }

  const mergedContent = readAndMergeFiles(files);

  // 复制到剪贴板
  await clipboardy.write(mergedContent);
  console.log("Merged content has been copied to clipboard.");
}

main();