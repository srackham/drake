# Drake Changelog

## 1.4.4 / 2020-10-12
- Upgraded to Deno version 1.4.6,`std@0.74.0`.

## 1.4.3 / 2020-10-04
- Included `env` API in `lib.ts`.
- On MS Windows use the PowerShell instead of `cmd.exe` to execute shell commands.
- Implemented Github Actions workflow for testing.

## 1.4.2 / 2020-09-26
- fix: Allow Drakefile execution with Deno `--unstable` option.
- Export  types `Action`, `EnvValue` from `mod.ts` module.
- Export  types `ShCaptureOpts`, `ShOpts`, `ShOutput` from `lib.ts` module.

## 1.4.1 / 2020-09-20
- Publish Drake to [nest.land](https://nest.land/package/drake) (in addition to
  [deno.land](https://deno.land/x/drake)).

## 1.4.0 / 2020-09-17
- Add `--cache FILE` command-line option.

## 1.3.2 / 2020-09-08
- Update examples.
- Rename `releases.md` to the more idiomatic `CHANGELOG.md`.

## 1.3.1 / 2020-09-07
- The `execute` API conditionally executes file task actions.
- Add `compile-async` task to the `examples/dynamic-tasks.ts` example Drakefile.
- An error is thrown if the `execute` API is not called from the `run` API.
- Report total time to run all tasks.
- Reassign `no action` and `out of date` info messages to debug messages.
- `glob` API debug message truncates files list to 100 files.
- `debug` API does not print `title` if it is blank.
- Upgraded to Deno version 1.3.3,`std/0.68.0`.

## 1.2.6 / 2020-08-03
- Upgraded to Deno version 1.2.2,`std/0.63.0`.

## 1.2.5 / 2020-07-14
- Upgraded to Deno version 1.2.0,`std/0.61.0`.

## 1.2.4 / 2020-06-27
- Upgraded to Deno version 1.1.2,`std/0.59.0`.

## 1.2.3 / 2020-06-16
- Upgraded to Deno version 1.1.0,`std/0.57.0`.

## 1.2.2 / 2020-06-04
- Upgraded to Deno version 1.0.5, `std/0.56.0`.

## 1.2.1 / 2020-06-04
- Upgraded to Deno version 1.0.4, `std/0.55.0`.

## 1.2.0 / 2020-05-31
- Include a stack trace in the `abort` API output if the `"--debug"` environment
  option is `true`.
- Added `makeDir` API.
- FIX: An error occurred if a File task contained a Normal task prerequisite.
- Upgraded to Deno version 1.0.3, `std/0.54.0`.

## 1.1.1 / 2020-05-21
- FIX: Cache file write error when using `--directory` option.

## 1.1.0 / 2020-05-21
- APIs that are can be used in non-drakefiles are exposed via `lib.ts`.
- Log message format consistency.
- Tightened `env` runtime parameter checks.
- A lot of code refactoring including splitting `deps.ts` into separate test and runtime deps.
- Upgraded to Deno version 1.0.1, `std/0.52.0`.

## 1.0.0 / 2020-05-15
Version 1.0.0 released.
