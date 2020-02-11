import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { test } from "https://deno.land/std/testing/mod.ts";
import { desc, task, tasks } from "../lib/tasks.ts";

test({
  name: "resolveActions",
  fn() {
    //   taskReg.clear()

    desc("Task 1");
    task("1", ["2", "3"], () => {});

    desc("Task 2");
    task("2", ["3"], () => {});

    desc("Task 3");
    task("3", [], () => {});

    assertEquals(tasks["1"].desc, "Task 1");
  }
});
