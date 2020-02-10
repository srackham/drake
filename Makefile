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

SRC_FILES = mod.ts lib/*.ts tmp/*.ts

.PHONY: test
test: fmt
	deno test -A tests/

.PHONY: fmt
fmt:
	deno fmt $(SRC_FILES)

.PHONY: run
run: test
	deno run -A Drakefile.ts foo "qux=Foo Bar" bar


