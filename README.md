# Zotero Categorial Tags Plugin

## Introduction

**Zotero Categorial Tags** is a plugin designed specifically for Zotero users to improve the efficiency and convenience
of tag management. By introducing the concept of **categorial tags**, users can organize, retrieve, and manage their
references more systematically, optimizing their research and study process.

## Features

- **Categorial Tags Column in the Item List**: Adds a categorial tags column to Zotero’s item list, clearly displaying
  the tags for each item.
- **Support for Categorial Tags**: Supports the `#Category/TagName` format, allowing tags to be categorized for easier
  management and retrieval.
- **Shortcut Support**: Quickly open the tag management dialog with the `Ctrl + T` shortcut.
- **Tag Management Dialog**: A user-friendly interface that allows for the addition and removal of existing categorial
  tags.
- **Fuzzy and Pinyin Search**: Powerful search functionality, supporting both fuzzy matching and pinyin input for quick
  tag discovery.

## Installation

1. **Download the plugin**:
    - Visit the [GitHub repository](https://github.com/panhaoyu/zotero-categorial-tags) and download the latest `.xpi`
      plugin file.

2. **Install the plugin**:
    - Open Zotero, click on `Tools` in the menu, and select `Add-ons`.
    - In the Add-ons Manager, click on the gear icon in the top right corner and choose `Install Add-on From File...`.
    - Select the downloaded `.xpi` file and follow the prompts to complete the installation.

3. **Restart Zotero**:
    - After the installation is complete, restart Zotero to activate the plugin.

## Usage Guide

### Creating Categorial Tags

**Note**: This plugin **does not support creating new tags**. It can only bind items to existing tags. You must manually
create tags in Zotero before using this plugin to manage and apply them.

1. **Format Requirements**:
    - Tag names must start with `#` and use `/` to separate the category and tag name.

2. **Examples**:
    - `#Subject/Mathematics`
    - `#Topic/Machine Learning`
    - `#ReadingStatus/Read`

### Recommended Tag Binding Process

1. **Select Items**:
    - In Zotero's main interface, select one or more items.

2. **Open the Tag Management Dialog**:
    - Press the `Ctrl + T` shortcut to open the tag management window.

3. **Search and Manage Tags**:
    - In the dialog, use the search bar at the top to quickly find tags, with support for fuzzy matching and pinyin
      search.
    - Click on tags in the search results to select or deselect them.

4. **Complete Tag Binding**:
    - After selecting or deselecting the desired tags, press `Enter` to save and close the dialog. The changes will be
      applied to the selected items.

### Viewing Categorial Tags

- **Display Categorial Tags in the Item List**:

    1. In Zotero's main interface, right-click on the column headers in the item list.
    2. From the menu, check `Categorial Tags` (or similar).
    3. The item list will now display the categorial tags for each reference, allowing for easy browsing and filtering.

## Keyboard Shortcuts

- **Open the Tag Management Dialog**: `Ctrl + T`

## Contribution and Support

- **Bug Reports**:
    - If you encounter any issues while using the plugin, feel free to submit an Issue on
      the [GitHub Issues page](https://github.com/panhaoyu/zotero-categorial-tags/issues).

- **Feature Requests**:
    - If you have suggestions for improving the plugin, we welcome your feedback and will consider it for future
      updates.

- **Contributing Code**:
    - Contributions are welcome! Submit a Pull Request to help us improve the plugin.

## Known Issues

- **macOS Support**: Currently, there is no support for macOS. Shortcuts and some features may not function correctly on
  macOS.
- **Tag Creation**: The plugin does not support creating new tags through the interface. Users must manually create
  categorial tags in Zotero.
- **Customization Options**: Future versions may include more customization options, such as different ways to display
  tags.

## Changelog

### v1.0.0

- Initial release.
- Support for adding and removing categorial tags.
- Fuzzy and pinyin search for tags.
- Added a categorial tags column to the item list.
- Shortcut support for opening the tag management dialog.

## License

- This project is open source under
  the [MIT License](./LICENSE).
- Complies with the AGPL agreement.

## Acknowledgements

- **zotero-plugin-template**: Special thanks to this project for providing the initial template, which greatly improved development efficiency.
- **zotero-style**: Thank you to this project for exploring the `#Tags` feature, which provided valuable inspiration for the development of this plugin.

