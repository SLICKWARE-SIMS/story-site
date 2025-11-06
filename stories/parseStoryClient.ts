import { parseMdxToAst, parseTree, type StoryTree } from "./parser";

interface Choice {
  id: number;
  text: string;
}

interface Scene {
  id: number;
  title: string;
  content: string;
  choices: Choice[];
}

interface Story {
  title: string;
  introduction: string;
  scenes: Scene[];
}

// Helper: convert a passage key like "#surprise-soup" to a display title "SURPRISE SOUP"
function slugToTitle(headerKey: string): string {
  const slug = headerKey.replace(/^#/, "");
  return slug.replaceAll("-", " ").toUpperCase();
}

export function parseStory(content: string): Story {
  // Use the shared MDX parser to build a StoryTree
  const ast = parseMdxToAst(content);
  const tree: StoryTree = parseTree(ast);

  // Title from frontmatter if available
  const title = (tree.metaData?.title as string) || "";

  // Build ordered list of passages preserving insertion order
  const passageEntries = Object.entries(tree.passages);

  // Determine introduction passage (commonly "#intro")
  const introIndex = passageEntries.findIndex(([key]) => key === "#intro");
  const introduction =
    introIndex >= 0
      ? (tree.passages["#intro"].text || []).join("\n\n").trim()
      : "";

  // Build a map from passage header to numeric scene id, skipping intro
  const headerToId = new Map<string, number>();
  let nextId = 1;
  for (const [key] of passageEntries) {
    if (key === "#intro") continue;
    headerToId.set(key, nextId++);
  }

  // Construct scenes in order, excluding intro
  const scenes: Scene[] = [];
  for (const [key, passage] of passageEntries) {
    if (key === "#intro") continue;
    const id = headerToId.get(key);
    if (!id) continue;

    const choices: Choice[] = [];
    for (const t of passage.transitions || []) {
      const targetId = headerToId.get((t.header || "").toLowerCase());
      if (typeof targetId === "number") {
        choices.push({ id: targetId, text: t.text });
      }
    }

    scenes.push({
      id,
      title: slugToTitle(key),
      content: (passage.text || []).join("\n\n").trim(),
      choices,
    });
  }

  return {
    title,
    introduction,
    scenes,
  };
}

export type { Choice,Scene, Story };
