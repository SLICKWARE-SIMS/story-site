import { readFileSync } from "fs";
import { parseMdxToAst, parseTree } from "./parser";
import { CYOARunner } from "../app/hooks/runner";

const mdxFile = readFileSync("./stories/blackMarket.mdx", "utf-8");

(async () => {
  const ast = await parseMdxToAst(mdxFile);
  console.log("ast: ", ast);
  const parsed = parseTree(ast);
  console.log("parsed: ", parsed);

  const runner = new CYOARunner(parsed);
  console.log("Initial Passage Text: ", runner.passageText);
  console.log("Initial Transition Options: ", runner.transitionOptions);
})();
