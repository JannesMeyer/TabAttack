# TabAttack browser extension

## Installation

Get the extension here:

- [Chrome](https://chrome.google.com/webstore/detail/tabattack/ginflokhdahakklidfjlogllkkhokidj)

## Features

The extension adds a tab counter to the toolbar:

![Tab counter](https://cloud.githubusercontent.com/assets/704336/6197251/9ea23dbe-b3e2-11e4-9e96-92f5f2783b85.png)

When you click it, you will see an overview of your tabs:

![Exported tabs](https://cloud.githubusercontent.com/assets/704336/6196991/056f4392-b3df-11e4-871e-33ed649db893.png)

You can now edit the document as you wish. After that you can:

- Download the current state of the editor as a *.md file

- Close all tabs (except the current one)

- Open a file that you saved earlier (drag and drop on top of the editor also works)

- Re-open all links as individial tabs that are currently in the editor. This will restore each unordered list in its own window. This whole acion only works if all links are inside of an unordered list, though.

There are keyboard shortcuts for these actions:

| Action                  | OS X | Windows      |
| ----------------------- | ---- | ------------ |
| Download                | ⌘S   | Ctrl+S       |
| Close all tabs          | ⌘Q   | Ctrl+Q       |
| Open a file             | ⌘O   | Ctrl+O       |
| Open all links          | ⇧⌘O  | Ctrl+Shift+O |
| Copy the whole document | ⌘C   | Ctrl+C       |

Furthermore, there are [many keyboard shortcuts for text editing inside the Ace editor](https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts).

## Tab management keyboard shortcuts

This extension also adds a few useful, general tab management keyboard shortcuts. Most of them have to be set manually by going to “Keyboard shortcuts” at the bottom of [chrome://extensions/](chrome://extensions/).

![Keyboard shortcut overview](https://cloud.githubusercontent.com/assets/704336/6196998/16341fe0-b3df-11e4-8dcb-a58665ffd354.png)

## Building

Clone the repository:

```bash
git clone https://github.com/JannesMeyer/TabAttack.git
```

Install the dependencies:

```bash
bun install
```

Build and watch for changes:

```bash
bun build:firefox
bun start
```

## Contributing

Pull requests and bug reports are welcome.

## Acknowledgments

Icon shape based on [Diamond by Catia Marsh Mallow from the Noun Project](https://thenounproject.com/term/star/28082/)

Special thanks to these projects:

- [Ace](https://ace.c9.io/)
- [React](https://reactjs.org/)
- [marked](https://github.com/markedjs/marked)

Icons from Firefox (MPL v2):

- /icons/firefox/tab.svg

## License

[AGPL v3](https://spdx.org/licenses/AGPL-3.0-only.html)
