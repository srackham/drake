import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { test } from "https://deno.land/std/testing/mod.ts";
import { Options, parseArgs, Variables } from "../lib/cli.ts";

test({
  name: "parseArgs",
  fn() {
    const opts: Options = {
      force: false,
      quiet: false,
      help: false,
      vers: false,
      list: false,
      dryrun: false,
      tasks: []
    };
    const vars: Variables = {};
    parseArgs(
      ["-h", "-q", "-f", "-l", "-n", "task1", "qux=42", "foo_bar=Foo & Bar",
        "task2"],
      opts,
      vars
    );
    assertEquals(opts.dryrun, true);
    assertEquals(opts.quiet, true);
    assertEquals(opts.force, true);
    assertEquals(opts.list, true);
    assertEquals(opts.help, true);
    assertEquals(opts.tasks.length, 2);
    assertEquals(opts.tasks[0], "task1");
    assertEquals(opts.tasks[1], "task2");
    assertEquals(vars.foo_bar, "Foo & Bar");
    assertEquals(vars.qux, "42");
  }
});
