# Drake &mdash; a task runner for Deno

Drake is a Make-like task runner for [Deno](https://deno.land/)
inspired by [Make](https://en.wikipedia.org/wiki/Make_(software)),
[Rake](https://github.com/ruby/rake) and
[Jake](https://github.com/jakejs/jake).

- Drakefiles (c.f. Makefiles) are Deno TypeScript modules.
- Optional task prerequisites (dependencies).
- File tasks and non-file tasks.
- Drake API functions for defining, registering and running tasks.

**NOTE**: This is a development release and will be subject to
breaking changes until 1.0 (see the Git commit log for `BREAKING
CHANGE`). A 1.0 production release will follow once Deno has reached
1.0.  If you experience compilation errors try forcing a cache reload
with the Deno `fetch` command e.g. `deno fetch Drakefile.ts --reload`

Tested with Deno 0.37.1 running on Ubuntu 18.04.


## Drakefiles
A drakefile is a TypeScript module that:

1. Imports the Drake module.
2. Defines and registers tasks.
3. Runs tasks.

Example drakefile:

``` typescript
import { desc, run, task } from "https://raw.github.com/srackham/drake/master/mod.ts";

desc("Minimal Drake task");
task("hello", [], function() {
  console.log("Hello World!");
});

run()
```

The `desc()` and `task()` APIs define and register tasks. The `run()`
API executes the tasks that were specified on the command-line along
with their prerequisite tasks. `run()` is normally the last statement
in the drakefile.  Tasks are executed in the correct dependency order.

Here are some of real-world drakefiles:

- https://github.com/srackham/drake/blob/master/Drakefile.ts
- https://github.com/srackham/rimu-deno/blob/master/Drakefile.ts

### Drakefile execution
Drakefiles are executed with the Deno `run` command, for example:

    deno -A Drakefile.ts
    deno minimal-drakefile.ts hello --quiet

- Use the Drake `--help` option to view the [Drake execution
  options](#drake-man-page).

- Use the Drake `--list` option to display a list of the list of
  available tasks.

- By convention, a project's drakefile is named `Drakefile.ts` and
  resides in the project's root directory.


## Tasks
There are two types of task: _Normal tasks_ and _File tasks_.

Task types are distinguished by their names.  _Normal task_ names can
only contain alphanumeric, underscore and hyphen characters and cannot
start with a hyphen e.g. `test`, `hello-world`. _File task_ names are
valid file paths. In cases of ambiguity a _File task_ name should be
prefixed with a period and a path separator e.g. `./hello-world`.

A _Normal task_ executes unconditionally.  A _File task_ is only
executed if it is out of date i.e. immediately prior to  execution
either the task name file path does not exist or one or more
prerequisite files has a more recent modification time.

If a _File task_ execution error occurs the following precautions are
taken to ensure the task remains out of date:

- If a new target file has been created then it is deleted.
- If an existing target file modification date has changed then it is
  reverted to the prior date.

File path task names and file task prerequisite names are normalized
at task registration.

### Task properties
**name**:
A unique task name.

**prereqs**:
An array of prerequisite task names i.e. the names of tasks to be run
prior to executing the task action function. Prerequisites can be
Normal task names, File task names, file paths and globs (wildcards):

- Normal task names must have a matching task.
- File path prerequisites do not require a matching task.
- Globs are expanded when the task is registered with the `task()`
  API.

**desc**:
An optional task description that is set by the `desc()` API.

**action**:
An optional function that is run if the task is selected for
execution.  The `action` function is bound to the parent task object
i.e. the parent task properties are accessible inside the action
function through the `this` object e.g. `this.prereqs` returns the
task's prerequisite names array.


### Asynchronous task actions
Normally you will want tasks to execute sequentially i.e. the next
task should not start until the current task has finished.  To ensure
this happens action functions that call asynchronous functions should:

1. Be delared `async`.
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


## Drake man page
To display the Drake options and command syntax run your drakefile
with the `--help` option:

```
$ deno -A Drakefile.ts --help

NAME
  drake - a make-like task runner for Deno.

SYNOPSIS
  deno [DENO_OPTION...] DRAKEFILE [OPTION|VARIABLE|TASK]...

DESCRIPTION
  The Drake TypeScript module provides functions for defining and executing
  build TASKs on the Deno runtime.

  A DRAKEFILE is a TypeScript module file containing Drake task definitions.
  Drakefiles are run with the Deno 'run' command.

  A Drake VARIABLE is a named string value e.g. 'vers=0.1.0'.  Variables are
  accessed via the Drake 'env' object e.g. 'env.vers' or 'env["vers"]'.

OPTIONS
  -a, --always-make     Unconditionally execute tasks.
  -d, --directory DIR   Change to directory DIR before running drakefile.
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

### Command-line variables
A Drake command-line variable is a named string value that is made
available to the drakefile.  Variables are formatted like
`<name>=<value>` e.g.  `vers=0.1.0`.  Variables are accessed within a
drakefile via the `env` object e.g.  `env.vers` or `env["vers"]`.

Variable names can only contain alphanumeric or underscore characters
and must start with an alpha character.


## Drake API
The Drake library module exports the following functions:

### abort
`function abort(message: string): void;`

Print error message to to `stdout` and terminate execution.

### debug
`function debug(title: string, message?: any): void;`

Write the `title` and `message` to stderr if it is a TTY and the
`--debug` command-line option was specified or the `DRAKE_DEBUG` shell
environment variable is set.

### desc
`function desc(description: string): void;`

Set description of next registered task. If a task has no description
then it won't be displayed in the tasks list unless the `-L` option is
used.

### env
The Drake `env` object stores command-line options, task names and
variables.

Options are keyed by their long option name e.g.  `env["--dry-run"]`.
Unspecified flag options are undefined; unspecified value options
are assigned their default value.

Task names are stored in the `env["--tasks"]` string array. A default
task can be specified by setting `env["--default-task"]` to the task
name.

Command-line variable values are keyed by name. For example
`vers=1.0.1` on the command-line is available as `env["vers"]` and
`env.vers`.

### execute
`async function execute(names: string | string[]);`

Unconditionally execute task action functions ignoring task prerequisites.

- If `names` is a task name string execute the task action.
- If `names` is an array of task names execute their actions asynchronously.
- Silently skip tasks that have no action function.

### glob
`function glob(...patterns: string[]): string[];`

Return a sorted array of normalized file names matching the wildcard patterns.
Wildcard patterns can include the `**` (globstar) pattern.
e.g. `glob("tmp/*.ts", "lib/**/*.ts", "mod.ts");`

### log
`function log(message: string): void;`

Log a message to the console. Do not log the message if the `--quiet`
command-line option is set.

### outOfDate
`function outOfDate(target: string, prereqs: string[]): boolean;`

Return `true` if either the target file does not exist or its
modification time is older then one or more prerequisite files.
Otherwise return `false`.

### quote
`function quote(values: string[], sep: string = " "): string;`

Quote string array values with double-quotes then join them with a separator.
Double-quote characters are escaped with a backspace.
The separator defaults to a space character.

### readFile
`function readFile(filename: string): string;`

Read the entire contents of a file synchronously to a UTF-8 string.

### run
`async function run(...names: string[]);`

Execute named tasks along with their prerequisite tasks (direct and
indirect). If no `names` are specified then the command-line tasks
are run. If no command-line tasks were specified the default task (set
in `env["--default-task"]`) is run.

Task execution is ordered such that prerequisite tasks are executed
prior to their parent task. The same task is never run twice.

### sh
`async function sh(commands: string | string[], opts: ShOpts = {});`

Execute commands in the command shell.

- If `commands` is a string execute it.
- If `commands` is an array of commands execute them asynchronously.
- If any command fails throw an error.
- If `opts.stdout` or `opts.stderr` is set to `"null"` then the respective outputs are ignored.
- `opts.cwd` sets the shell current working directory (defaults to the parent process working directory).
- The `opts.env` mapping passes additional environment variables to the shell.

Examples:

``` typescript
await sh("echo Hello World");
await sh(["echo Hello 1", "echo Hello 2", "echo Hello 3"]);
await sh("echo Hello World", { stdout: "null" });
```

### shCapture
`async function shCapture(command: string, opts: ShCaptureOpts = {}): Promise<ShOutput>;`

Execute `command` in the command shell and return a promise for
`{code, output, error}` (the exit code, the stdout output and the
stderr output).

- If the `opts.input` string has been assigned then it is piped to the
  shell `stdin`.
- `opts.cwd` sets the shell current working directory (defaults to the
  parent process working directory).
- The `opts.env` mapping passes additional environment variables to
  the shell.
- `opts.stdout` and `opts.stderr` have `Deno.ProcessStdio` semantics.
  `opts.stdout` defaults to `"piped"`. `opts.stderr` defaults to
  `"inherit"` (to capture stderr set `opts.stderr` to `"piped"`).

Examples:

``` typescript
const { code, output } = await shCapture("echo Hello"); 
```

### task
`function task(name: string, prereqs: string[] = [], action?: Action): void;`

Create and register a task.

- `name` is a unique task name.
- `prereqs` is an array of prerequisite task names i.e. the names of
  tasks to be run prior to executing the task action function.
- `action` is an optional function (`type Action = (this: Task) =>
  any;`) that is run if the task is selected for execution.

### touch
`function touch(...files: string[]): void;`

Update the modification time of each file to the current time.
If a file does not exist then create a zero length file.
Missing parent directory paths are also created.

### writeFile
`function writeFile(filename: string, text: string): void;`

Write text to a file synchronously. If the file exists it will be
overwritten.

### updateFile
`function updateFile(filename: string, find: RegExp, replace: string): void;`

Find and replace in text file synchronously.

### vers
`function vers(): string;`

Returns the Drake version number string.


## Tips for using Drake
- A shell alias shortcut can be set to run the default drakefile:

      alias drake="deno -A Drakefile.ts"

- Use shell quoting and escapes to pass command-line variable values
  containing spaces or special characters e.g. `"title=Foo & bar"`.

- Don't forget to use `await` when calling `async` functions.

- Task path name prerequisites can be glob wildcards.

- Path names can refer to any file type (not just regular files).

- The Drake `sh` API can be used to run multiple shell commands
  asynchronously. The following example starts two shell commands then
  waits for both to finish before continuing:

        await sh(["echo foo", "echo bar"]);

- The Drake `sh` API can be used to run multi-line template string
  scripts e.g.

      await sh(`set -e  # Exit immediately on error.
          echo Hello World
          if [ "$EUID" -eq 0 ]; then
              echo "Running as root"
          else
              echo "Running as $USER"
          fi
          ls
          wc Drakefile.ts`);

- The built-in [Deno API](https://deno.land/typedoc/) has many useful
  functions e.g.

      Deno.mkdirSync(dirname);
      const tempDir= Deno.makeTempDirSync();
      const modTime = Deno.statSync(filename).modified;
      Deno.copyFileSync(from, to);

- Escape backslash and backtick characters and placeholders in
  template string literals with a backslash:

  * `\\` translates to `\`
  * `` \` `` translates to `` ` ``
  * `\${` translates to `${` 

- You can use Drake API functions in non-drakefiles.  Useful utility
  functions include: `abort`, `glob`, `log`, `outOfDate`, `quote`,
  `readFile`, `sh`, `shCapture`, `touch`, `updateFile`, `writeFile`.
  By default Drake functions manifest errors by printing an error
  message and exiting with a non-zero exit code.  You can change the
  default behaviour so that errors throw a `DrakeError` exception
  by setting `env["--abort-exits"] = false`.  For example:

      import { env, glob, sh } from "https://raw.github.com/srackham/drake/master/mod.ts";
      env["--abort-exits"] = false;
