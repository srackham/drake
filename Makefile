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

.PHONY: test
test: fmt
	deno test --allow-env --allow-write --allow-net tests/

.PHONY: fmt
fmt:
	deno fmt lib/*.ts tests/*.ts

