import { describe, expect,it } from "vitest";

import { parseStory } from "./parseStoryClient";

describe("parseStoryClient", () => {
  describe("parseStory", () => {
    it("should parse a minimal MDX story with title from frontmatter", () => {
      const mdx = `---
title: Test Story
---

## INTRO

This is the introduction.

## START

You are at the start.

- [Go to the end](#end)

## END

You reached the end.
`;

      const result = parseStory(mdx);

      expect(result.title).toBe("Test Story");
      expect(result.introduction).toBe("This is the introduction.");
      expect(result.scenes).toHaveLength(2);
      expect(result.scenes[0]).toMatchObject({
        id: 1,
        title: "START",
        content: "You are at the start.",
        choices: [{ id: 2, text: "Go to the end" }],
      });
      expect(result.scenes[1]).toMatchObject({
        id: 2,
        title: "END",
        content: "You reached the end.",
        choices: [],
      });
    });

    it("should handle story without frontmatter", () => {
      const mdx = `## INTRO

Welcome to the story.

## FIRST

First scene here.
`;

      const result = parseStory(mdx);

      expect(result.title).toBe("");
      expect(result.introduction).toBe("Welcome to the story.");
      expect(result.scenes).toHaveLength(1);
      expect(result.scenes[0].title).toBe("FIRST");
    });

    it("should handle story without intro section", () => {
      const mdx = `---
title: No Intro Story
---

## START

Jump right in.

- [Next](#next)

## NEXT

Second scene.
`;

      const result = parseStory(mdx);

      expect(result.introduction).toBe("");
      expect(result.scenes).toHaveLength(2);
      expect(result.scenes[0].id).toBe(1);
    });

    it("should convert kebab-case headers to uppercase titles", () => {
      const mdx = `## INTRO

Intro text.

## surprise-soup

You found soup!

## one-bowl-of-soup-please

Here's your bowl.
`;

      const result = parseStory(mdx);

      expect(result.scenes[0].title).toBe("SURPRISE SOUP");
      expect(result.scenes[1].title).toBe("ONE BOWL OF SOUP PLEASE");
    });

    it("should handle multiple paragraphs in scene content", () => {
      const mdx = `## INTRO

Intro.

## SCENE

First paragraph.

Second paragraph.

Third paragraph.

- [Continue](#next)

## NEXT

Next scene.
`;

      const result = parseStory(mdx);

      expect(result.scenes[0].content).toBe(
        "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
      );
    });

    it("should map choices to correct scene IDs", () => {
      const mdx = `## INTRO

Start here.

## ALPHA

First scene.

- [Go to Beta](#beta)
- [Go to Gamma](#gamma)

## BETA

Second scene.

- [Back to Alpha](#alpha)

## GAMMA

Third scene.
`;

      const result = parseStory(mdx);

      // Alpha should be scene 1, Beta scene 2, Gamma scene 3
      expect(result.scenes[0].id).toBe(1);
      expect(result.scenes[0].title).toBe("ALPHA");
      expect(result.scenes[0].choices).toEqual([
        { id: 2, text: "Go to Beta" },
        { id: 3, text: "Go to Gamma" },
      ]);

      expect(result.scenes[1].id).toBe(2);
      expect(result.scenes[1].choices).toEqual([
        { id: 1, text: "Back to Alpha" },
      ]);

      expect(result.scenes[2].id).toBe(3);
      expect(result.scenes[2].title).toBe("GAMMA");
    });

    it("should raise an error when parsing choices with invalid/missing targets", () => {
      const mdx = `## INTRO

Test.

## START

Scene with bad links.

- [Valid link](#end)
- [Invalid link](#nonexistent)

## END

The end.
`;

      expect(() => {
        parseStory(mdx);
      }).toThrow(ReferenceError)

    });

    it("should handle scenes with no choices", () => {
      const mdx = `## INTRO

Story intro.

## DEAD-END

This scene has no choices.

## ANOTHER

Another ending.
`;

      const result = parseStory(mdx);

      expect(result.scenes[0].choices).toEqual([]);
      expect(result.scenes[1].choices).toEqual([]);
    });

    it("should preserve insertion order for scenes", () => {
      const mdx = `## INTRO

Intro.

## ZULU

Last alphabetically.

## ALPHA

First alphabetically.

## MIKE

Middle alphabetically.
`;

      const result = parseStory(mdx);

      // Should be in document order, not alphabetical
      expect(result.scenes[0].title).toBe("ZULU");
      expect(result.scenes[0].id).toBe(1);
      expect(result.scenes[1].title).toBe("ALPHA");
      expect(result.scenes[1].id).toBe(2);
      expect(result.scenes[2].title).toBe("MIKE");
      expect(result.scenes[2].id).toBe(3);
    });

    it("should handle empty content in scenes", () => {
      const mdx = `## INTRO

Intro content.

## EMPTY

- [Next](#next)

## NEXT

Content here.
`;

      const result = parseStory(mdx);

      expect(result.scenes[0].content).toBe("");
      expect(result.scenes[0].choices).toHaveLength(1);
    });

    it("should handle complex Black Market story structure", () => {
      const mdx = `---
title: Black Market
author: dmgCTRL
---

{inventory.credits = 50}

## INTRO

A SIMULATION OF [INTRIGUE]

You enter block [13,17].

- [Enter the block](#start)

## START

You arrive in block [13,17] and are greeted by vendors.

- [Surprise soup](#surprise-soup)
- [Yeast man](#yeast-man)

## SURPRISE-SOUP

A woman stirs a pot.

- [One bowl please](#one-bowl)

## ONE-BOWL

She hands you soup.

## YEAST-MAN

A man stirs yeast.
`;

      const result = parseStory(mdx);

      expect(result.title).toBe("Black Market");
      expect(result.introduction).toContain("A SIMULATION OF [INTRIGUE]");
      expect(result.scenes).toHaveLength(4);

      const startScene = result.scenes.find((s) => s.title === "START");
      expect(startScene).toBeDefined();
      expect(startScene?.choices).toHaveLength(2);

      const soupScene = result.scenes.find((s) => s.title === "SURPRISE SOUP");
      expect(soupScene).toBeDefined();
      expect(soupScene?.choices).toHaveLength(1);
    });

    it("should handle MDX with initialization scripts", () => {
      const mdx = `---
title: Story With Scripts
---

{inventory.credits = 100}
{inventory.health = 50}

## INTRO

Welcome!

## START

{health = health - 10}

Your health decreased.

- [Continue](#next)

## NEXT

Next scene.
`;

      const result = parseStory(mdx);

      // Scripts are parsed but not included in content/choices
      expect(result.scenes[0].content).toBe("Your health decreased.");
      expect(result.scenes[0].choices).toHaveLength(1);
    });

    it("should handle story with only one scene", () => {
      const mdx = `---
title: Single Scene
---

## INTRO

Introduction text.

## ONLY

This is the only scene.
`;

      const result = parseStory(mdx);

      expect(result.scenes).toHaveLength(1);
      expect(result.scenes[0].title).toBe("ONLY");
      expect(result.scenes[0].id).toBe(1);
    });

    it("should handle mixed case in link targets", () => {
      const mdx = `## INTRO

Test.

## START

Beginning.

- [Go to End](#END)
- [Go to Middle](#MiDdLe)

## END

Ending.

## MIDDLE

Middle section.
`;

      const result = parseStory(mdx);

      const startScene = result.scenes.find((s) => s.title === "START");
      // Parser normalizes headers to lowercase for matching
      expect(startScene?.choices).toHaveLength(2);
    });

    it("should handle story with frontmatter but no title", () => {
      const mdx = `---
author: Test Author
version: 1.0
---

## INTRO

Story without title field.

## START

First scene.
`;

      const result = parseStory(mdx);

      expect(result.title).toBe("");
      expect(result.introduction).toBe("Story without title field.");
    });

    it("should trim whitespace from content and introduction", () => {
      const mdx = `## INTRO


   Introduction with extra whitespace.   


## START


   Content with whitespace.   


- [Next](#next)

## NEXT

End.
`;

      const result = parseStory(mdx);

      expect(result.introduction).toBe("Introduction with extra whitespace.");
      expect(result.scenes[0].content).toBe("Content with whitespace.");
    });
  });

  it("should handle titles with special characters", () => {
    const mdx = `---
title: The "Great" Adventure!
---

## INTRO

Intro here.

## START

Beginning of the "Great" Adventure!

- [Go on!](#next-the-thing)

## NEXT, the thing!

The adventure continues.
`;

    const result = parseStory(mdx);

    expect(result.title).toBe('The "Great" Adventure!');
    expect(result.scenes[0].title).toBe("START");
  });

  it("should preserve newlines in the middle of a scene's content", () => {
    const mdx = `## INTRO

Intro text.

## SCENE

This is the first line.

This is the second line.

This is the third line.

- [Continue](#next)

## NEXT

Next scene.
`;

    const result = parseStory(mdx);

    expect(result.scenes[0].content).toBe(
      "This is the first line.\n\nThis is the second line.\n\nThis is the third line."
    );
  });

  // describe("should load the blackMarket story successfully", () => {
  //   const fs = require("fs");
  //   const path = require("path");
  //   const storyPath = path.join(__dirname, "..", "stories", "blackMarket.mdx");
  //   const mdxContent = fs.readFileSync(storyPath, "utf-8");

  //   const result = parseStory(mdxContent);

  //   expect(result.title).toBe("Black Market");
  //   expect(result.introduction).toContain("A SIMULATION OF [INTRIGUE]");
  //   expect(result.scenes.length).toBeGreaterThan(0);
  //   result.scenes.forEach((scene) => {
  //     if (scene.id === 2) {
  //       console.log(scene);
  //     }
  //     it(`scene ${scene.id}: ${scene.title} should have content and choices`, () => {
  //       expect(scene.content.length).toBeGreaterThan(0);
  //       expect(scene.choices.length).toBeGreaterThan(0);
  //     });
  //   });
  // });
});
