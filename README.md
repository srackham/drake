# Drake

Drake a make-like task runner for [Deno](https://deno.land/) inspired
by [Make](https://en.wikipedia.org/wiki/Make_(software)),
[Rake](https://github.com/ruby/rake) and
[Jake](https://github.com/jakejs/jake).


## Drakefiles
A drakefile is a TypeScript (or JavaScript) module file that:

1. Imports the Drake module.
2. Defines and registers tasks.
3. Runs tasks plus prerequisite (dependent) tasks.

The `drake` CLI is a thin wrapper for executing a drakefile.

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
in the drakefile.  Tasks are executed once in the correct dependency
order.

Here are a couple of real-world examples:

- https://github.com/srackham/drake/blob/master/Drakefile.ts
- https://github.com/srackham/rimu-deno/blob/master/Drakefile.ts


## drake CLI
To install the `drake` CLI executable:

    deno install --force -A https://raw.github.com/srackham/drake/master/drake.ts

Run it with e.g.

    $HOME/.deno/bin/drake --help

**NOTE**: The `drake` CLI is handy, but you can also run drakefiles
directly with the `deno run` command.


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
  -n, --dry-run         Skip execution of task actions.
  -q, --quiet           Do not log drake messages to standard output.
  --version             Display the drake version.

ENVIRONMENT VARIABLES
  NO_COLOR              Set to disable color (see https://no-color.org/).

SEE ALSO
  The Drake user guide: https://github.com/srackham/drake
```

## Drake API
The Drake library module exports the following objects and functions:

### abort
`function abort(message: string): void;`

Throw `DrakeError` with error message to terminate execution.

### desc
`function desc(description: string): void;`

Set description of next registered task.

### env
The Drake `env` object contains the command-line options, tasks an
variables:

Options are keyed by their long option name e.g.  `env["--dry-run"]`.
Unspecified flag options are undefined; unspecified value options
assume their default value.

Tasks names are stored in the `env["--tasks"]` string array. A default
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

Execute Drake command-line options and tasks. If `names` is omitted
then the command-line tasks are run. If there are no command-line
tasks the default task (set in `env["--default-task"]`) is run.

### sh
`async function sh(commands: string | string[]);`

Execute commands in the command shell.
If `commands` is a string execute it.
If `commands` is an array of commands execute them in parallel.
If any command fails throw an error.

### task
`function task( name: string, prerequisites: string[] = [], action?: Action): void;`

Create and register a task.  The `action` function parameter is bound
to the task object `type Action = (this: Task) => any;`.

### writeFile
`function writeFile(filename: string, text: string): void;`

Write text to a new file with given filename synchronously.

### updateFile
`function updateFile(filename: string, find: RegExp, replace: string): void;`

Find and replace in text file synchronously.

### vers
The Drake version number.


## Tasks
There are two types of task, _Normal_ tasks and _File_ tasks.  A
_Normal_ task_ executes unconditionally. A _File_ task is only executed if
the target file is out of date i.e. either it does not exist or one or
more prerequisite files has a more recent modification time.

Task types are distinguished by their names.  _Normal_ task names can
only contain alphanumeric, underscore and hyphen characters and cannot
start with a hyphen e.g. `test`, `hello-world`. _File_ task names are
valid file paths. In cases of ambiguity the path should be prefixed
with a period and a path separator e.g. `./hello-world`.

Tasks have the following properties:

**name**:
A unique task name.

**prereqs**:
An array of prerequisite task names of tasks to be run prior to
executing the task action function.

- Prerequisites can be Normal task names, File task names, file paths
  and globs (wildcards).
- Globs are expanded when the task is registered.
- Normal prerequisite names must have a matching task.
- File path prerequisite names do not require a matching task.

**desc**:
A an optional task description that is set by the `desc()` API.

**action**:
A function that is run if the task is selected for execution.  Task
properties are accessible inside the action function through the
`this` object e.g. `this.prereqs` returns the task's prerequisites
array.


## Task name normalization
- Wildcard (globbed) ask prerequisites are expanded at task registration.
- Task target and prerequisite names are normalized at task registration.


## File tasks
- If the task name is a file path the task will not be executed unless all of the prerequisite file
  paths are older than the target file path.

- 

either an absolute path or a relative starting with a `.` character)

-

## Globbing
[Glob primer](https://github.com/isaacs/node-glob/blob/master/README.md#glob-primer).


## Tips for using Drake
- A DRAKEFILE can be run directly with the 'deno run' command and can
  be installed as an executable using the `deno install` command.

- Don't forget `await` when calling `async` functions.

- Task path name prerequisites can be glob wildcards.

- Task path name prerequisites can refer to any file type (not just regular files).

- Escape backslash and backtick characters and placeholders in template string literals with a backslash:

  * `\\` translates to `\`
  * `` \` `` translates to `` ` ``
  * `\${` translates to `${` 

- Use drake alias to execute Drakefile.ts:

  alias drake='deno -A Drakefile.ts'

- Read file info e.g.

  Deno.statSync(f).modified

- Use spread operator to construct arrays from arrays e.g.

  ['foo', ...glob('*.ts')]
  
- Read file to string:

  readFileStrSync(filename).toString();

- Write string to file:

  writeFileStrSync(filename, 'Hello world!')

- Replace text in file:

  let text = readFileStrSync(filename).toString();
  text = text.replace(/foo/gi, 'bar');
  writeFileStrSync(filename, text);


EXAMPLE DRAKEFILE


VARIABLES
  A variable is a named string value that is made available to the drakefile.
  Variables are formatted like '<name>=<value>' e.g. 'vers=0.1.0'.  Variables
  are accessed via the 'env' object e.g. 'env.vers' or 'env["vers"]'.

  Variable names can only contain alphanumeric or underscore characters and
  must start with an alpha character.

  Tip: Use shell quoting and escapes to pass values containing spaces or
  special characters e.g. 'title=Foo & bar'.


ENVIRONMENT
  The exported Drake 'env' object contains:

  Variables: From the command-line (see VARIABLES).



TASKS
  - Task prerequisites are executed before the task is executed.
  - Task execution order corresponds to the declaration order unless overriden
    by prerequisite dependencies.
  - Tasks are executed sequential i.e. the next task won't be started until the
    previous task has completed.
  - File and non-file tasks differentiated by name: file names must be prefixed
    with '/', './', or '../' e.g. 'foobar' is a non-file task, './foobar' is a
    file task,
  - Task names can only contain alphanumeric or underscore characters and must
    start with an alpha character.


ACTION FUNCTIONS
  - All async functions must be awaited to ensure the task completes before starting the next task.

  - Action functions containing 'await' statements must be declared with the
    'async' keyword.

API FUNCTIONS
  The Drake 'mod.ts' module exports the following functions:

  function desc(description: string): void;
      Set description of next registered task.

  function task(name: string, prereqs: string[] = [], action?: Action): void;
      Register task.

  async function run();
      Run Drake command-line options and named tasks.

  function glob(...patterns: string[]): string[];
      Return array of file names matching the glob patterns relative to the
      current working directory.  e.g. glob("tmp/*.ts", "lib/*.ts", "mod.ts");
