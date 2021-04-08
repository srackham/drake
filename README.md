# Drake &mdash; a task runner for Deno

[Drake](https://github.com/srackham/drake) is a Make-like task runner
for [Deno](https://deno.land/) inspired by
[Make](https://en.wikipedia.org/wiki/Make_(software)),
[Rake](https://github.com/ruby/rake) and
[Jake](https://github.com/jakejs/jake).

- Drakefiles (c.f. Makefiles) are Deno TypeScript modules.
- Optional task prerequisites (dependencies).
- File tasks and non-file tasks.
- Drake API functions for defining, registering and running tasks.

**Status**: Tested with Deno 1.6.3 running on Github CI the following platforms:
`ubuntu-latest`, `macos-latest`, `windows-latest`. See also the
[changelog](CHANGELOG.md).


## Drakefiles
A drakefile is a TypeScript module that:

1. Imports the Drake module.
2. Defines and registers tasks.
3. Runs tasks.

### Example drakefile

``` typescript
import { desc, run, task } from "https://deno.land/x/drake@v1.4.6/mod.ts";

desc("Minimal Drake task");
task("hello", [], function() {
  console.log("Hello World!");
});

run()
```

To run the above example, copy and paste it into a file and run it
with Deno. For example:

```
$ deno run -A minimal-drakefile.ts hello
hello started
Hello World!
hello finished (0ms)
```

The `desc()` and `task()` APIs define and register tasks. The `run()`
API executes the tasks that were specified on the command-line along
with their prerequisite tasks. `run()` is normally the last statement
in the drakefile.  Tasks are executed in the correct dependency order.

- Use the Drake `--help` option to list [Drake command-line
  options](#drakefile-execution).  For example:

      deno run -A minimal-drakefile.ts --help

- By convention, a project's drakefile is named `Drakefile.ts` and
  resides in the project's root directory.

Here are some of real-world drakefiles:

- https://github.com/srackham/drake/blob/master/Drakefile.ts
- https://github.com/srackham/rimu/blob/master/Drakefile.ts


### Importing Drake
A Drakefile uses Drake APIs imported from the Drake `mod.ts` module file. The module can be imported from:

- [deno.land](https://deno.land/x/drake) (Deno's third party modules registry). For example:

      import { desc, run, task } from "https://deno.land/x/drake@v1.4.6/mod.ts";

- [nest.land](https://nest.land/package/drake) (a blockchain based Deno modules registry).  
  **NOTE**: Drake version numbers in `nest.land` URLs are not prefixed with a 'v' character:

      import { desc, run, task } from "https://x.nest.land/drake@1.4.6/mod.ts";

Some Drake APIs are useful in non-drakefiles, use `lib.ts` (not `mod.ts`) to
import them into non-drakefile modules.


## Tasks

### Task types
There are two types of task:

**Normal task**: A _normal task_ executes unconditionally.

**File task**: A _file task_ is only executed if it is out of date.

Task types are distinguished by their names.  _Normal task_ names can
only contain alphanumeric, underscore and hyphen characters and cannot
start with a hyphen e.g. `test`, `hello-world`. _File task_ names are
valid file paths. In cases of ambiguity a _file task_ name should be
prefixed with a period and a path separator e.g. `./hello-world`.

### Task properties
**name**:
A unique task name.

**desc**:
An optional task description that is set by the `desc()` API. Tasks
without a description are not displayed by the `--list-tasks`
command-line option (use the `-L` option to include hidden tasks and
task prerequisites in the tasks list).

**prereqs**:
An array of prerequisite task names i.e. the names of tasks to be run
prior to executing the task action function. Prerequisites can be
normal task names, file task names, file paths or globs (wildcards).

**action**:
An optional function that is run if the task is selected for
execution.  The `action` function is bound to the parent task object
i.e. the parent task properties are accessible inside the action
function through the `this` object e.g. `this.prereqs` returns the
task's prerequisite names array.

### Task execution
Task execution is ordered such that prerequisite tasks (direct and
indirect) are executed prior to their parent task. The same task is
never run twice.

- The execution directory defaults to the current working directory (this can be
  changed using the Drake `--directory` command-line option).

- Task name and prerequisite file paths are normalized at task
  registration.

- Prerequisite globs are expanded when the task is registered.

- Prerequisites are resolved at the time the task is run.

- All prerequisite files must exist by the time the task executes. An
  error is thrown if any are missing.

- A file task is considered to be out of date if:

  * The target file does not exist.
  * The target file or any of the prerequisite files have changed
    since the task was last executed successfully.
  * The Drake version or the operating system has changed
    since the task was last executed successfully.

- A file is considered to have changed if it's current modification
  time or size no longer matches those recorded immediately after the task had
  last executed successfully.

- Before exiting Drake saves the target and prerequisite file properties of
  tasks that have successfully executed:

  * File properties are saved to a file named `.drake.cache.json` in the
    drakefile execution directory (this file path can be changed using the
    Drake `--cache` command-line option).
  * Task target and prerequisite file properties are recorded immediately after
    successful task execution (if a task fails its properties are not updated).
  * A cache file will not be created until at least one file task has successfully executed.

### Asynchronous task actions
Normally you will want tasks to execute sequentially i.e. the next
task should not start until the current task has finished.  To ensure
this happens action functions that call asynchronous functions should:

1. Be declared `async`.
2. Call asynchronous functions with the `await` operator.

For example, the following task does not return until the shell
command has successfully executed:

``` typescript
task("shell", [], async function() {
  await sh("echo Hello World");
});
```

Without the `await` operator `sh("echo Hello World")` will return
immediately and the action function will exit before the shell command
has even started.

Of course you are free to eschew `await` and use the promises
returned by asynchronous functions in any way that makes sense.

### Drakefile execution
A drakefile is executed from the command-line. Use the `--help` option
to view Drake command-line options and syntax.  For example:

```
$ deno run -A Drakefile.ts --help

NAME
  drake - a make-like task runner for Deno.

SYNOPSIS
  deno run -A DRAKEFILE [OPTION|VARIABLE|TASK]...

DESCRIPTION
  The Drake TypeScript module provides functions for defining and executing
  build TASKs on the Deno runtime.

  A DRAKEFILE is a TypeScript module file containing Drake task definitions.
  Drakefiles are run with the Deno 'run' command.

  A Drake VARIABLE is a named string value e.g. 'vers=0.1.0'.  Variables are
  accessed using the Drake 'env' API e.g. 'env("vers").

OPTIONS
  -a, --always-make     Unconditionally execute tasks.
  --cache FILE          Set Drake cache file path to FILE.
  -d, --directory DIR   Change to directory DIR before running drakefile.
  -D, --debug           Write debug information to stderr.
  -h, --help            Display this help message.
  -l, -L, --list-tasks  List tasks (-L for hidden tasks and prerequisites).
  -n, --dry-run         Skip task execution.
  -q, --quiet           Do not log drake messages to standard output.
  --version             Display the drake version.

ENVIRONMENT VARIABLES
  NO_COLOR              Set to disable color (see https://no-color.org/).

SEE ALSO
  The Drake user guide: https://github.com/srackham/drake
```

The `--directory` option sets the drakefile execution directory and
defaults to the current working directory. The `--directory` option
allows a single drakefile to be used to build multiple project
directories.

If no command-line tasks are given the default task is run (specified
by setting the `env` API `"--default-task"` value).

A Drake command-line variable is a named string value that is made
available to the drakefile.  Variables are formatted like
`<name>=<value>` e.g.  `vers=0.1.0`.  Variables are accessed within a
drakefile using the `env` API e.g.  `env("vers")`.  Variable names can
only contain alphanumeric or underscore characters and must start with
an alpha character.


## Drake API
The Drake library module exports the following functions:

### abort
``` typescript
function abort(message: string): void;
```

Write an error message to `stderr` and terminate execution.

- If the `"--abort-exits"` environment option is `false` throw a `DrakeError`.
- If the `"--debug"` environment option is `true` include the stack trace in
  the error message.

### debug
``` typescript
function debug(title: string, message?: any): void;
```

Write the `title` and `message` to stderr if it is a TTY and the
`--debug` command-line option was specified or the `DRAKE_DEBUG` shell
environment variable is set.

### desc
``` typescript
function desc(description: string): void;
```

Set description of next registered task. If a task has no description
then it won't be displayed in the tasks list unless the `-L` option is
used.

### env
``` typescript
function env(name?: string, value?: EnvValue): any;
```

The Drake `env` API function gets and optionally sets the command-line
options, task names and variables.

Options are keyed by their long option name e.g. `env("--dry-run")`.
Command-line flag options return a boolean; the `--cache` and `--directory`
options return a string.

Command-line variables are keyed by name. For example `vers=1.0.1` on the
command-line sets the `vers` value to `"1.0.1"`.

Command-line tasks are stored in the `--tasks` string array.

Examples:

``` typescript
env("--abort-exits", false);
env("--default-task", "test");
console.log(`version: ${env("vers")}`);
if (!env("--quiet")) console.log(message);
```

### execute
``` typescript
async function execute(...taskNames: string[]);
```

Execute task action functions.
First the non-async actions are executed synchronously then the
async actions are exectuted asynchronously.
Silently skip tasks that have no action function.

### glob
``` typescript
function glob(...patterns: string[]): string[];
```

Return a sorted array of normalized file names matching the wildcard patterns.
Valid glob patterns are those supported by Deno's `path` library
Example: `glob("tmp/*.ts", "lib/**/*.ts", "mod.ts");`

### log
``` typescript
function log(message: string): void;
```

Log a message to stdout. Do not log the message if the `--quiet`
command-line option is set.

### makeDir
``` typescript
function makeDir(dir: string): boolean;
```

Create directory.

- Missing parent directory paths are created.
- Returns `true` if a new directory was created.
- Returns `false` if the directory already exists.

### quote
``` typescript
function quote(values: string[], sep = " "): string;
```

Quote string array values with double-quotes then join them with a separator.
Double-quote characters are escaped with a backspace.
The separator defaults to a space character.

### readFile
``` typescript
function readFile(filename: string): string;
```

Read the entire contents of a file synchronously to a UTF-8 string.

### run
``` typescript
async function run(...taskNames: string[]);
```

Execute named tasks along with their prerequisite tasks (direct and
indirect). If no task names are specified then the command-line tasks
are run. If no command-line tasks were specified the default task is
run (specified by setting the `env` API `"--default-task"` value).

Task execution is ordered such that prerequisite tasks are executed
prior to their parent task. The same task is never run twice.

### sh
``` typescript
async function sh(commands: string | string[], opts: ShOpts = {});
```

Execute commands in the command shell.

- If `commands` is a string execute it.
- If `commands` is an array of commands execute them asynchronously.
- If any command fails throw an error.
- If `opts.stdout` or `opts.stderr` is set to `"null"` then the respective outputs are suppressed.
- `opts.cwd` sets the shell current working directory (defaults to the parent process working directory).
- The `opts.env` mapping passes additional environment variables to the shell.

 On MS Windows run `PowerShell.exe -Command <cmd>`. On other platforms run `$SHELL -c <cmd>` (if `SHELL`
 is not defined use `/bin/bash`).
 
Examples:

``` typescript
await sh("echo Hello World");
await sh(["echo Hello 1", "echo Hello 2", "echo Hello 3"]);
await sh("echo Hello World", { stdout: "null" });
```

### shCapture
``` typescript
async function shCapture(command: string, opts: ShCaptureOpts = {}): Promise<ShOutput>;
```

Execute `command` in the command shell and return a promise for
`{code, output, error}` (the exit code, the stdout output and the
stderr output).

- If the `opts.input` string has been assigned then it is piped to the
  shell `stdin`.
- `opts.cwd` sets the shell current working directory (defaults to the
  parent process working directory).
- The `opts.env` mapping passes additional environment variables to
  the shell.
- `opts.stdout` and `opts.stderr` have `Deno.RunOptions` semantics.
  `opts.stdout` defaults to `"piped"`. `opts.stderr` defaults to
  `"inherit"` (to capture stderr set `opts.stderr` to `"piped"`).

Examples:

``` typescript
const { code, output } = await shCapture("echo Hello"); 
const { code, output, error } = await shCapture("mkdir tmpdir", { stderr: "piped" });
```

### task
``` typescript
function task(name: string, prereqs?: string[], action?: Action): Task;
```

Create and register a task. Returns the task object.

- `name` is a unique task name.
- `prereqs` is an array of prerequisite task names.  Prerequisites can
  be normal task names, file task names, file paths or globs
  (wildcards).
- `action` is an optional function that is run if the task is selected
  for execution (`type Action = (this: Task) => any;`).
- To fetch an existing task omit both the `prereqs` and `action`
  parameters.

### writeFile
``` typescript
function writeFile(filename: string, text: string): boolean;
```

Write text to a file synchronously. If the file exists it will be overwritten.
Returns `true` if a new file was created; returns `false` if the file already
exists.

### updateFile
``` typescript
function updateFile(filename: string, find: RegExp, replace: string): boolean;
```

Find and replace in text file synchronously.  If the file contents is
unchanged return `false`.  If the contents has changed write it to the
file and return `true`.

### vers
``` typescript
function vers(): string;
```

Returns the Drake version number string.


## Tips for using Drake
- A shell alias shortcut can be set to run the default drakefile:

      alias drake="deno run -A Drakefile.ts"

- Use shell quoting and escapes to pass Drake command-line variable values
  that contain spaces or special characters e.g. `"title=Foo & bar"`.

- Don't forget to use `await` when calling `async` functions.

- Task path name prerequisites can be glob wildcards.

- Task name and prerequisite file paths can refer to any file type
  (not just regular files).

- The Drake `sh` API can be used to run multiple shell commands
  asynchronously. The following example starts two shell commands then
  waits for both to finish before continuing:

        await sh(["echo foo", "echo bar"]);

- The Drake `sh` API can be used to run multi-line template string
  scripts e.g.

    ``` sh
    await sh(`set -e  # Exit immediately on error.
        echo Hello World
        if [ "$EUID" -eq 0 ]; then
            echo "Running as root"
        else
            echo "Running as $USER"
        fi
        ls
        wc Drakefile.ts`);
    ```

- Escape backslash and backtick characters and placeholders in
  template string literals with a backslash:

  * `\\` translates to `\`
  * `` \` `` translates to `` ` ``
  * `\${` translates to `${` 

- Tasks can be created dynamically at runtime. The following example is from
  [examples/dynamic-tasks.ts](https://github.com/srackham/drake/blob/master/examples/dynamic-tasks.ts):

    ``` typescript
    for (const prereq of glob("*.md")) {
      const target = `${path.basename(prereq, ".md")}.html`;
      task(target, [prereq], async function () {
        await sh(`markdown "${prereq}" > "${target}"`);
      });
    }
    ```

- Task actions can be run asynchronously using the `execute` API. The following
  example is from
  [examples/dynamic-tasks.ts](https://github.com/srackham/drake/blob/master/examples/dynamic-tasks.ts):

    ``` typescript
    await execute(...tasks);  // 'tasks' is a list of tasks with asynchronous action functions.
    ```

- When running multiple tasks asynchronously, for example using the `execute`
  API, take care that there are no mutual dependencies that could cause race
  conditions.

- More meaningful file task names can be created with a dummy normal task. In
  the following example the `build-docs` task executes the `./docs/index.html`
  task. The `./docs/index.html` task will be hidden from the `--list-tasks`
  command because it has not been assigned a description.

    ``` typescript
    desc("Build documents");
    task("build-docs", ["./docs/index.html"]);
    task("./docs/index.html", [...]) {
      ...
    });
    ```

- When executing in a drakefile, Drake functions manifest errors by printing an
  error message and exiting with a non-zero exit code.  You can change this
  behavior so that errors throw a `DrakeError` exception by setting
  `env("--abort-exits", false)`. In non-drakefiles errors throw a `DrakeError`
  exception by default.

-  Selected sections of code can be "debugged" by bracketing with
   `env("--debug",true)` and `env("--debug",false)` statements.

- Drake API debug messages will be emitted if the `DRAKE_DEBUG` shell
  environment variable is set. This can be useful in conjunction with
  the `debug` API in non-drakefiles (in lieu of the Drake `--debug`
  command-line option).

- The Deno `run` command automatically compiles updated source and
  writes compilation messages to `stderr`. This can interfere with tests
  that capture Deno `run` command outputs. Use the Deno `--quiet` option
  to eliminate this problem.

- In addition to the command-line `--cache FILE` option you can also set a
  custom cache file path from within a Drakefile before calling the `run` API.
  For example:

    ``` typescript
    env("--cache", path.join(env("--directory"), "my-cache.json"));
    ```

- Set the `--cache` option value to a blank string to restore the
  default cache file path:
      
    ``` typescript
    env("--cache", "");
    ```