# Drake &mdash; a task runner for Deno

Drake is a make-like task runner for [Deno](https://deno.land/)
inspired by [Make](https://en.wikipedia.org/wiki/Make_(software)),
[Rake](https://github.com/ruby/rake) and
[Jake](https://github.com/jakejs/jake).

**NOTE**: This is a development release. A production release will
follow once Deno has reached 1.0.

Tested with Deno 0.34.0


## Drakefiles
A drakefile is a TypeScript module that:

1. Imports the Drake module.
2. Defines and registers tasks.
3. Runs tasks plus prerequisite tasks.

Example drakefile:

```
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

Here are a couple of real-world examples:

- https://github.com/srackham/drake/blob/master/Drakefile.ts
- https://github.com/srackham/rimu-deno/blob/master/Drakefile.ts


## drake CLI
The `drake` CLI is a thin wrapper for executing a drakefile.

To install the `drake` CLI executable:

    deno install --force -A drake https://raw.github.com/srackham/drake/master/drake.ts

Run it with e.g.

    $HOME/.deno/bin/drake --help

The `drake` CLI is handy, but you can also run drakefiles directly
with the `deno run` command.


## Tasks
There are two types of task: _Normal tasks_ and _File tasks_.

Task types are distinguished by their names.  _Normal task_ names can
only contain alphanumeric, underscore and hyphen characters and cannot
start with a hyphen e.g. `test`, `hello-world`. _File task_ names are
valid file paths. In cases of ambiguity a _File task_ name should be
prefixed with a period and a path separator e.g. `./hello-world`.

A _Normal task_ executes unconditionally.  A _File task_ is only
executed if it is out of date i.e. either the task name file does not
exist or one or more prerequisite files has a more recent modification
time.

Task names and task prerequisite names are normalized at task
registration.

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


## Asynchronous task actions
Normally you will want tasks to execute sequentially i.e. the next
task should not start until the current task has finished.  To ensure
this happens action functions that call asynchronous functions should:

1. Be delared `async`.
2. Call asynchronous functions with the `await` operator.

For example, the following task does not return until the shell
command has successfully executed:

```
task("shell", [], async function() {
  await sh("echo Hello World");
});
```

Without the `await` operator `sh("echo Hello World")` will return
immediately and the action function will exit before the shell command
has even started.

Of course you are free to run code asynchronously if that makes sense.


## Drake man page
```
NAME
  drake - a make-like task runner for Deno.

SYNOPSIS
  drake [OPTION|VARIABLE|TASK]...
  deno run [DENO_OPTION...] DRAKEFILE [OPTION|VARIABLE|TASK]...

DESCRIPTION
  The Drake TypeScript library provides functions for defining and executing
  build TASKs on the Deno runtime.

  A DRAKEFILE is a TypeScript module file containing Drake task definitions.
  The 'drake' CLI is a thin wrapper for executing a DRAKEFILE.

  A Drake VARIABLE is a named string value e.g. 'vers=0.1.0'.  Variables are
  accessed via the Drake 'env' object e.g. 'env.vers' or 'env["vers"]'.

OPTIONS
  -a, --always-make     Unconditionally execute tasks.
  -d, --directory DIR   Change to directory DIR before running drakefile.
  -f, --drakefile FILE  Use FILE as drakefile (default: './Drakefile.ts').
  -h, --help            Display this help message.
  -l, --list-tasks      Display task names, descriptions and prerequisites.
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
The Drake library module exports the following objects and functions:

### abort
`function abort(message: string): void;`

Throw `DrakeError` with error message to terminate execution.

### desc
`function desc(description: string): void;`

Set description of next registered task.

### env
The Drake `env` object contains the command-line options, tasks and
variables:

Options are keyed by their long option name e.g.  `env["--dry-run"]`.
Unspecified flag options are undefined; unspecified value options
assume their default value.

Task names are stored in the `env["--tasks"]` string array. A default
task can be specified by setting `env["--default-task"]` to the task
name.

Variable values are keyed by name. For example `vers=1.0.1` on the
command-line is available as `env["vers"]` and `env.vers`.

### execute
`async function execute(name: string);`

Unconditionally execute the named task without its prerequisites.

### glob
`function glob(...patterns: string[]): string[];`

Return array of normalized file names matching the glob patterns.
e.g. `glob("tmp/*.ts", "lib/*.ts", "mod.ts");`

### log
`function log(message: string): void;`

Log a message to the console. Do not log the message if the `--quiet`
command-line option is set.

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
indirect). If no `names` are specified then the the command-line tasks
are run. If no command-line tasks were specified the default task (set
in `env["--default-task"]`) is run.

Task execution is ordered such that prerequisite tasks are executed
prior to parent tasks. The same task is never run twice.

### sh
`async function sh(commands: string | string[]);`

Execute commands in the command shell.
If `commands` is a string execute it.
If `commands` is an array of commands execute them in parallel.
If any command fails throw an error.

### task
`function task( name: string, prereqs: string[] = [], action?: Action): void;`

Create and register a task.

- `name` is a unique task name.
- `prereqs` is an array of prerequisite task names i.e. the names of
  tasks to be run prior to executing the task action function.
- `action` is an optional function that is run if the task is selected
  for execution.

### writeFile
`function writeFile(filename: string, text: string): void;`

Write text to a file synchronously. If the file exists it will be
overwritten.

### updateFile
`function updateFile(filename: string, find: RegExp, replace: string): void;`

Find and replace in text file synchronously.

### vers
`const vers: string;`

The Drake version number.


## Tips for using Drake
- Use shell quoting and escapes to pass command-line variable values
  containing spaces or special characters e.g. `"title=Foo & bar"`.

- Don't forget to use `await` when calling `async` functions.

- Task path name prerequisites can be glob wildcards.

- Path names can refer to any file type (not just regular files).

- Use the Drake `readFile`, `writeFile` and `updateFile` APIs to
  synchronously read, write and update text files.

- The Drake `sh` API can be used to run multiple shell commands
  asynchronously. The following example starts two shell commands then
  waits for both to finish before continuing:

        await sh(["echo foo", "echo bar"]);

- The Drake `sh` API can be used to run multi-line template string
  bash scripts e.g.

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

- Escape backslash and backtick characters and placeholders in
  template string literals with a backslash:

  * `\\` translates to `\`
  * `` \` `` translates to `` ` ``
  * `\${` translates to `${` 

- A drakefile can be run directly with the `deno run` command and can
  also be installed as an executable using the `deno install` command.

