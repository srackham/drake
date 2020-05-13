import { assertEquals } from "../deps.ts";
import { Graph } from "../lib/graph.ts";

Deno.test("graphTest", function () {
  const g = new Graph();
  g.addNode("u", ["v", "x"]);
  g.addNode("v", ["y"]);
  g.addNode("w", ["y", "z"]);
  g.addNode("x", ["v"]);
  g.addNode("y", ["x"]);
  g.addNode("z", ["z"]);
  g.searchForCycles();
  assertEquals(
    g.errors,
    [
      "cyclic dependency between 'x' and 'v'",
      "cyclic dependency between 'z' and 'z'",
    ],
  );
});
