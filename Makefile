WEBPACK = ./node_modules/.bin/webpack

all: node_modules firefox chrome

chrome:
	$(WEBPACK) --config webpack-chrome.config.js

watch-chrome:
	$(WEBPACK) --config webpack-chrome.config.js -w

pack-chrome:
	NODE_ENV=production $(WEBPACK) --config webpack-chrome.config.js
	rm chrome-extension.zip
	zip -vx '*.DS_Store' -r chrome-extension.zip src

firefox:
	@-killall firefox-bin &> /dev/null
	@cd firefox
	@jpm run

clean:
	@rm -r src/build

.PHONY: all chrome watch-chrome firefox clean