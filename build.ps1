$t = mkdir build

./node_modules/.bin/tsc --sourceMap false --outDir $t/dist
Copy-Item -Recurse _locales, icons, fonts, images $t
Copy-Item *.css, *.html, manifest.json, LICENSE $t

# marked
$m = mkdir $t/node_modules/marked/lib
Copy-Item node_modules/marked/marked.min.js $m/marked.js
Copy-Item node_modules/marked/LICENSE.md $m/../LICENSE.md

# webextension-polyfill
$m = mkdir $t/node_modules/webextension-polyfill/dist
Copy-Item node_modules/webextension-polyfill/dist/browser-polyfill.min.js $m/browser-polyfill.js
Copy-Item node_modules/webextension-polyfill/LICENSE $m/../LICENSE

# react
$m = mkdir $t/node_modules/react/umd
Copy-Item node_modules/react/umd/react.production.min.js $m/react.development.js
Copy-Item node_modules/react/LICENSE $m/../LICENSE

# react-dom
$m = mkdir $t/node_modules/react-dom/umd
Copy-Item node_modules/react-dom/umd/react-dom.production.min.js $m/react-dom.development.js
Copy-Item node_modules/react-dom/LICENSE $m/../LICENSE

# ace-builds
$m = mkdir $t/node_modules/ace-builds
Copy-Item -Recurse node_modules/ace-builds/src-min-noconflict $m/src-noconflict
Copy-Item node_modules/ace-builds/LICENSE $m/LICENSE

Compress-Archive $t/* TabAttack.zip -Force
Remove-Item -Recurse $t
