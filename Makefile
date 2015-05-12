WEBPACK = ./node_modules/.bin/webpack

chrome: node_modules
	$(WEBPACK) --config webpack.chrome.js

chrome-watch: node_modules
	$(WEBPACK) --config webpack.chrome.js -w

firefox: node_modules
	$(WEBPACK) --config webpack.firefox.js

firefox-watch: node_modules
	$(WEBPACK) --config webpack.firefox.js -w

pack-chrome:
	NODE_ENV=production $(WEBPACK)
	rm chrome-extension.zip
	zip -vx '*.DS_Store' -r chrome-extension.zip chrome

clean:
	@rm -r src/build

.PHONY: all chrome watch-chrome firefox clean