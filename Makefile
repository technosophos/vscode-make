.PHONY: build
build:
	npm run compile

.PHONY: test
test:
	

.PHONY: package
package:
	vsce package

.PHONY: publish
publish: package
publish:
	vsce publish