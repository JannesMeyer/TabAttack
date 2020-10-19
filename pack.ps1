$compress = @{
  Path =
		"_locales",
		"dist",
		"fonts",
		"icons",
		"images",
		"*.css",
		"*.html",
		"manifest.json",
		"LICENSE",
		"node_modules/webextension-polyfill/dist/browser-polyfill.js",
		"node_modules/react/umd/react.development.js",
		"node_modules/react-dom/umd/react-dom.development.js",
		"node_modules/ace-builds/src-noconflict",
		"node_modules/marked/lib/marked.js"
  CompressionLevel = "Fastest"
  DestinationPath = "TabAttack.zip"
  Force = $true
  WhatIf = $true
}
Compress-Archive @compress
