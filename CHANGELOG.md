# Drake Changelog

## 1.7.0 / 2024-02-07

- Replace deprecated `Deno.run` function with `Deno.Command` class (Drake `sh` and `shCapture` APIs).
- Compatibility updates for [Deno 1.4 release](https://deno.com/blog/v1.4).

## 1.6.0 / 2022-07-19

- Added `stat(path)` API function which returns information about a file or
  `null` if the file does not exist.
- Added `remove(...patterns)` API function which deletes files matching the
  wildcard patterns.
- FIX: `glob` API fails if pattern begins with a nonexistent directory e.g.
  `non-existent-directory/*`.

## 1.5.2 / 2022-05-20

- FIX: Drake crashes when listing tasks with no description (https://github.com/srackham/drake/issues/18).
- Upgraded to Deno 1.22.0, standard modules 0.140.0.

## 1.5.1 / 2022-02-20

- Upgraded to Deno 1.19.0, standard modules 0.123.0.

## 1.5.0 / 2021-05-27

- Added `--verbose` command-line option (currently it prints `sh` and
  `shCapture` API calls).
- Drake execution output now highlights execution times.
- Upgraded to Deno version 1.10.2, `std@0.97.0`.

## 1.4.7 / 2021-04-21

- Upgraded to Deno 1.9.0, standard modules 0.93.0.

## 1.4.6 / 2021-01-06

- Upgraded to Deno 1.6.3, standard modules 0.83.0.

## 1.4.5 / 2020-11-16

- Upgraded to Deno 1.5.2, standard modules 0.77.0.

## 1.4.4 / 2020-10-12

- Upgraded to Deno 1.4.6, standard modules 0.74.0.

## 1.4.3 / 2020-10-04

- Included `env` API in `lib.ts`.
- On MS Windows use the PowerShell instead of `cmd.exe` to execute shell
  commands.
- Implemented Github Actions workflow for testing.

## 1.4.2 / 2020-09-26

- FIX: Allow Drakefile execution with Deno `--unstable` option.
- Export types `Action`, `EnvValue` from `mod.ts` module.
- Export types `ShCaptureOpts`, `ShOpts`, `ShOutput` from `lib.ts` module.

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
- Upgraded to Deno 1.3.3, standard modules 0.68.0.

## 1.2.6 / 2020-08-03

- Upgraded to Deno 1.2.2, standard modules 0.63.0.

## 1.2.5 / 2020-07-14

- Upgraded to Deno 1.2.0, standard modules 0.61.0.

## 1.2.4 / 2020-06-27

- Upgraded to Deno 1.1.2, standard modules 0.59.0.

## 1.2.3 / 2020-06-16

- Upgraded to Deno 1.1.0, standard modules 0.57.0.

## 1.2.2 / 2020-06-04

- Upgraded to Deno 1.0.5, standard modules 0.56.0.

## 1.2.1 / 2020-06-04

- Upgraded to Deno 1.0.4, standard modules 0.55.0.

## 1.2.0 / 2020-05-31

- Include a stack trace in the `abort` API output if the `"--debug"` environment
  option is `true`.
- Added `makeDir` API.
- FIX: An error occurred if a File task contained a Normal task prerequisite.
- Upgraded to Deno 1.0.3, standard modules 0.54.0.

## 1.1.1 / 2020-05-21

- FIX: Cache file write error when using `--directory` option.

## 1.1.0 / 2020-05-21

- APIs that are can be used in non-drakefiles are exposed via `lib.ts`.
- Log message format consistency.
- Tightened `env` runtime parameter checks.
- A lot of code refactoring including splitting `deps.ts` into separate test and
  runtime deps.
- Upgraded to Deno 1.0.1, standard modules 0.52.0.

## 1.0.0 / 2020-05-15

Version 1.0.0 released.
