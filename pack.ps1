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
		"node_modules/ace-builds/src-noconflict",
		"node_modules/webextension-polyfill/dist/browser-polyfill.js"
  CompressionLevel = "Fastest"
  DestinationPath = "TabAttack.zip"
  Force = $true
  WhatIf = $true
}
Compress-Archive @compress
