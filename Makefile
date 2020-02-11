# Drake Makefile

# Set defaults (see http://clarkgrubb.com/makefile-style-guide#prologue)
MAKEFLAGS += --warn-undefined-variables
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := test
.DELETE_ON_ERROR:
.SUFFIXES:
.ONESHELL:
.SILENT:

SRC_FILES = Drakefile.ts mod.ts lib/*.ts tests/*.ts tmp/*.ts

.PHONY: test
test: fmt
	deno test -A tests/

.PHONY: fmt
fmt:
	deno fmt $(SRC_FILES)

.PHONY: run
run: test
	deno run -A ./examples/Drakefile.ts 1 3 "qux=Foo Bar" 2


