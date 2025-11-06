import { remark } from "remark";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import YAML from "yaml";

const scriptTypes = ["mdxjsEsm", "mdxFlowExpression", "mdxJsxFlowElement"];

export interface Transition {
  transitionCriteria: string | null;
  header: string;
  text: string;
  isValid?: boolean;
}

export interface Passage {
  initializationScript: string[];
  text: string[];
  transitions: Transition[];
}

export interface StoryTree {
  passages: Record<string, Passage>;
  metaData?: Record<string, unknown>;
  initializationScript: string[];
}

function parseHeader(tokens: any[]): Record<string, unknown> {
  if (tokens.length == 0 || tokens.at(-1).type != "thematicBreak") {
    return {};
  }
  tokens.pop();
  const header = YAML.parse(tokens.at(-1).children[0].value);
  tokens.pop();
  return header;
}

function parseAllType(
  tokens: unknown[],
  valid_types: string[],
  list: string[]
): void {
  while (
    tokens.length > 0 &&
    valid_types.includes((tokens.at(-1) as any).type)
  ) {
    list.push((tokens.pop() as any).value);
  }
}

function convertStringMarkdownHeaderFormat(s: string): string {
  // Convert to lowercase, replace spaces with hyphens, remove special characters except hyphens
  return (
    "#" +
    s
      .toLowerCase()
      .replaceAll(" ", "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

function parseTransition(transition: any): Transition {
  if (!scriptTypes.includes(transition.children[0].type)) {
    return {
      transitionCriteria: null,
      header: transition.children[0].children[0].url.toLowerCase(),
      text: transition.children[0].children[0].children[0].value,
    };
  }
  if (
    transition.children[0].type == "mdxJsxFlowElement" &&
    transition.children[0].name.toLowerCase() == "if"
  ) {
    return {
      transitionCriteria: transition.children[0].attributes[0].value.value,
      header: transition.children[0].children[0].children[0].url,
      text: transition.children[0].children[0].children[0].children[0].value,
    };
  }

  throw new TypeError();
}

function parsePassage(tokens: unknown[], tree: StoryTree): void {
  while (tokens.length > 0 && (tokens.at(-1) as any).type != "heading") {
    tokens.pop();
  }
  if (tokens.length == 0) {
    return;
  }
  const header_name = convertStringMarkdownHeaderFormat(
    (tokens.pop() as any).children[0].value
  );
  tree.passages[header_name] = {
    initializationScript: [],
    text: [],
    transitions: [],
  };

  while (tokens.length > 0 && (tokens.at(-1) as any).type != "heading") {
    if (scriptTypes.includes((tokens.at(-1) as any).type)) {
      tree.passages[header_name].initializationScript.push(
        (tokens.pop() as any).value
      );
      continue;
    }
    if ((tokens.at(-1) as any).type == "paragraph") {
      const paragraph = tokens.pop() as any;
      const value = paragraph.children?.[0]?.value ?? "";
      tree.passages[header_name].text.push(value);
      continue;
    }
    if ((tokens.at(-1) as any).type == "list") {
      (tokens.pop() as any).children.forEach((element: any) => {
        tree.passages[header_name].transitions.push(parseTransition(element));
      });
      continue;
    }
    throw new TypeError();
  }
}

export function parseTree(ast: ReturnType<typeof parseMdxToAst>): StoryTree {
  const tree: StoryTree = {
    passages: {},
    metaData: {},
    initializationScript: [],
  };
  const tokens = ast.children;
  tokens.reverse();
  tree.metaData = parseHeader(tokens);
  tree.initializationScript = [];
  parseAllType(tokens, scriptTypes, tree.initializationScript);

  // Will there be intro text?
  // Would need to parse that here is so

  while (tokens.length > 0) {
    parsePassage(tokens, tree);
  }
  console.log("tree: ", tree);

  Object.values(tree.passages).forEach((passage, index) => {
    passage.transitions.forEach((transition) => {
      if (!(transition.header in tree.passages)) {
        throw new ReferenceError(
          `Transition to non-existing passage: ${transition.header}`
        );
      }
    });
  });

  return tree;
}

export function parseMdxToAst(mdxInput: string) {
  return remark().use(remarkParse).use(remarkMdx).parse(mdxInput);
}
