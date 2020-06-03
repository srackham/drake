# Drake releases

## 1.2.1 / 2020-06-04
- Upgraded to Deno `std/0.55.0`.

## 1.2.0 / 2020-05-31
- Include a stack trace in the `abort` API output if the `"--debug"` environment
  option is `true`.
- Added `makeDir` API.
- FIX: An error occured if a File task contained a Normal task prerequisite.
- Upgraded to Deno `std/0.54.0`.


## 1.1.1 / 2020-05-21
- FIX: Cache file write error when using `--directory` option.


## 1.1.0 / 2020-05-21
- APIs that are can be used in non-drakefiles are exposed via `lib.ts`.
- Log message format consistency.
- Tightened `env` runtime parameter checks.
- A lot of code refactoring including spliting `deps.ts` into separate test and runtime deps.
- Upgraded to Deno `std/0.52.0`.


## 1.0.0 / 2020-05-15
Version 1.0.0 released.
