# TabAttack browser extension

## Installation

Get the extension here:

- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tabattack2/)
- [Chrome](https://chrome.google.com/webstore/detail/tabattack/ginflokhdahakklidfjlogllkkhokidj)

## Building

Install the dependencies:

```bash
bun install
```

Build for Firefox:

```bash
bun build:firefox
```

## Debugging with React DevTools

Install:

```bash
npm install -g electron react-devtools
```

Launch React DevTools:

```sh
electron $(npm root -g)/react-devtools/app
```

Insert the script tag on the page you want to debug:

```html
<script src="http://localhost:8097"></script>
```

Temporarily allow connections in CSP (manifest.json) and rebuild the manifest for your current browser with the appropriate `bun build:` command.


## Firefox keyboard shortcuts

To override builtin Firefox shortcuts such as ⌘S or ⌘P you have to clear them via `about:keyboard` first.

## Acknowledgments

Icon shape based on [Diamond by Catia Marsh Mallow from the Noun Project](https://thenounproject.com/term/star/28082/)

## License

[AGPL v3](https://spdx.org/licenses/AGPL-3.0-only.html)
