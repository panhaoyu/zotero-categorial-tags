# Zotero Categorial Tags Plugin

[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)

![](doc/Pane.jpg)

Documentation | [中文文档](doc/README-zhCN.md)

## Introduction

**Zotero Categorial Tags** is a plugin designed for Zotero users to enhance tag management efficiency. By using *
*categorial tags**, users can systematically organize, retrieve, and manage references, optimizing their research and
study processes.

## Features

- **Categorial Tags Column**: Adds a categorial tags column in the item list, clearly showing each reference's tag
  information.
- **Categorial Tag Support**: Supports the `#Category/TagName` format to classify tags for easier management and
  retrieval.
- **Shortcut Key**: Press `Ctrl + T` (customizable) to quickly open the tag management dialog.
- **Tag Management Dialog**: Provides a user-friendly interface to add and remove existing tags.
- **Fuzzy and Pinyin Search**: Supports fuzzy matching and pinyin search to quickly locate tags.

## Installation

### Method 1: Install from Add-on Store

- Go to the [Zotero Add-ons Store](https://github.com/syt2/zotero-addons) and find **Zotero Categorial Tags** to
  install.

### Method 2: Manual Installation

1. Download the latest `.xpi` file from the [GitHub repository](https://github.com/panhaoyu/zotero-categorial-tags).
2. Open Zotero, click `Tools` -> `Add-ons` -> Gear icon -> `Install Add-on From File...`, and select the `.xpi` file to
   complete the installation.
3. Restart Zotero to activate the plugin.

## Usage Guide

### Creating Categorial Tags

**Note**: The plugin does not support creating new tags. It can only bind items to existing tags. Please manually create
appropriate tags in Zotero before managing them with the plugin.

1. **Format Requirements**: Tags must start with `#` and use `/` to separate the category and tag name.

2. **Examples**:

    - `#Subject/Mathematics`
    - `#Topic/Machine Learning`
    - `#ReadingStatus/Read`

### Tag Binding Process

1. **Select Items**: In Zotero's main interface, select one or more items.
2. **Open the Tag Management Dialog**: Press the custom shortcut key (default `Ctrl + T`) to open the tag management
   window.
3. **Search and Manage Tags**: Use the search bar to find tags quickly, supporting pinyin and fuzzy search. Click on
   tags to select or deselect them.
4. **Complete Binding**: Press `Enter` to save the changes.

### Viewing Categorial Tags

1. In Zotero's main interface, right-click on the column headers in the item list.
2. Check `Categorial Tags` to display categorial tags for each reference.

## Contribution and Support

- **Bug Reports**: If you encounter issues, submit an Issue on
  the [GitHub Issues page](https://github.com/panhaoyu/zotero-categorial-tags/issues).
- **Feature Suggestions**: Suggestions for improvement are welcome.
- **Contributing Code**: Pull Requests are welcome to help improve the plugin.

## Known Issues

- **macOS Support**: There has been no testing on macOS due to the lack of test devices. macOS users are welcome to test
  and provide feedback.
- **Tag Creation**: The plugin does not support creating tags; they must be created manually. The implementation of this
  feature is undecided, and users are encouraged to share ideas on the Issues page.
- **Customization Options**: Future versions will include more customization options.
- **Interface Design**: The current interface has not been aesthetically enhanced. Users with design experience are
  encouraged to provide suggestions or submit PRs.

Contributions to address the above issues are welcome via Pull Requests.

## Changelog

- **v0.1.9**: Added customizable shortcut keys.
- **v0.1.0**: Initial release with support for categorial tag management, fuzzy and pinyin search, and keyboard
  shortcuts.

## License

- This project is open source under
  the [MIT License](https://github.com/panhaoyu/zotero-categorial-tags/blob/main/LICENSE).

## Acknowledgements

- **zotero-plugin-template**: Thanks for providing the initial template, which greatly improved development efficiency.
- **zotero-style**: Thanks for exploring the `#Tags` feature, which provided valuable inspiration for this plugin's
  development.
