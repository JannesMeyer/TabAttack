WEBPACK = ./node_modules/.bin/webpack

all: node_modules
	$(WEBPACK)

watch:
	$(WEBPACK) -w

pack-chrome:
	NODE_ENV=production $(WEBPACK)
	rm chrome-extension.zip
	zip -vx '*.DS_Store' -r chrome-extension.zip src

firefox:
	cd firefox
	jpm run

clean:
	@rm -r src/build

.PHONY: all chrome watch-chrome firefox clean