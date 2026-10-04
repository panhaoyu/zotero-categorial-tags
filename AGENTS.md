# AGENTS.md — 项目开发偏好

本文件供 AI 编码助手（opencode 默认读取）与贡献者参考，描述本项目的开发约定与偏好。

## 项目定位

- 本项目是 Zotero 插件（支持 Zotero 7–10），已完全采用 AIGC（AI 生成代码）方式开发，功能可能不够完善。
- 遇到问题时，优先引导用户到 [GitHub Issues](https://github.com/panhaoyu/zotero-categorial-tags/issues) 反馈，不承诺功能完备性。

## 语言规范（重要）

- 代码注释、JSDoc、测试用例描述、提交信息、本文件等一律使用中文。
- README 等主要文档保持中英双语：`README.md`（英文）与 `doc/README-zhCN.md`（中文），两者内容应保持同步。
- 用户可见文案禁止硬编码，统一写入 FTL（`addon/locale/*/addon.ftl`），通过 `getString()` 获取。
- 例外：机器指令性注释（如 `// @ts-check`、`/* eslint-disable */`、脚手架生成文件的头注释）保持原样。

## 技术栈与结构

- TypeScript 严格模式（已开启 `noUncheckedIndexedAccess` 等），优先显式类型，避免 `any`。
- 依赖：zotero-plugin-toolkit 6、zotero-types 4、zotero-plugin-scaffold 0.9.2、Jest 29 + ts-jest；Node >= 22.8。
- `@swc/core` 固定在 1.16.2（原因见 README），请勿随意升级。
- 目录：`src/modules` 业务逻辑、`src/utils` 工具、`src/testUtils` 测试 mock、`addon/` 静态资源与 FTL、`typings/` 全局类型（含脚手架生成文件）。

## 开发与验证

- 常用命令：`npm run typecheck`、`npm run test`、`npm run lint`、`npm run build`（产出 `build/*.xpi`）。
- 任何代码修改后必须全部通过：typecheck + test + lint；涉及构建配置或资源时还需 `npm run build`。
- 禁止未经验证的提交；禁止提交 `build/`、`tmp/`、`data/`、`.env` 等（见 `.gitignore`）。
- 测试文件与被测模块同目录，命名 `*.test.ts`；纯逻辑测试使用 `src/testUtils/mockZotero.ts` 模拟 Zotero 全局，不依赖真实 Zotero。

## 提交规范

- 提交信息格式 `type(scope): 中文描述`，scope 必填（如 `core`、`tooling`、`readme`、`modules`）。
- 变更较大时分批提交：测试、类型/重构、逻辑改动分开，便于按提交独立审查与验证。
- 逻辑改动的提交应保持独立可回滚；行为不变的重构不得混入逻辑修复。

## 其它偏好

- 类型与元数据约定优先：新增偏好、常量、ID 等应集中定义并保持命名一致。
- Zotero 数据目录一律只读；开发使用 `.env` 指定的 dev profile 与项目内数据目录，勿触碰日常库数据。
- 临时脚本放 `tmp/`，用完即删，不提交。
