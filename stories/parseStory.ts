import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function parseStory(filePath: string): Story {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  let currentIndex = 0;
  const story: Story = {
    title: "",
    introduction: "",
    scenes: [],
  };

  // Parse title (first non-empty line)
  while (currentIndex < lines.length && !lines[currentIndex].trim()) {
    currentIndex++;
  }
  story.title = lines[currentIndex++].trim();

  // Parse introduction until we hit the first numbered scene
  const introLines: string[] = [];
  while (currentIndex < lines.length) {
    const line = lines[currentIndex];
    // Check if this is the start of a scene (e.g., "1. START")
    if (/^\d+\.\s+\w+/.test(line.trim())) {
      break;
    }
    introLines.push(line);
    currentIndex++;
  }
  story.introduction = introLines
    .join("\n")
    .trim();

  // Parse scenes
  while (currentIndex < lines.length) {
    const line = lines[currentIndex].trim();

    // Look for scene headers like "1. START", "2. SURPRISE SOUP"
    // Must be at start of line or after whitespace, and be followed by alphanumeric
    const sceneMatch = line.match(/^(\d+)\.\s+([A-Z].*)$/);
    if (sceneMatch && line === line.trim()) {
      // Ensure it's a proper scene header (at the actual start)
      const sceneId = parseInt(sceneMatch[1], 10);
      let sceneTitle = sceneMatch[2].trim();

      // Remove any trailing scene number if it got attached (e.g., "ONE BOWL OF SOUP, PLEASE 5")
      sceneTitle = sceneTitle.replace(/\s+\d+\.\s+.*$/, "");

      currentIndex++;

      // Collect scene content until we hit choices or another scene
      const contentLines: string[] = [];
      while (currentIndex < lines.length) {
        const contentLine = lines[currentIndex];
        const trimmed = contentLine.trim();

        // Check if this is a choice line like "[5] One bowl of soup please"
        if (/^\[\d+\]/.test(trimmed)) {
          break;
        }

        // Check if this is the next scene header (must start with digit and period)
        if (/^\d+\.\s+[A-Z]/.test(trimmed)) {
          break;
        }

        contentLines.push(contentLine);
        currentIndex++;
      }

      const content = contentLines
        .join("\n")
        .trim();

      // Parse choices
      const choices: Choice[] = [];
      while (currentIndex < lines.length) {
        const choiceLine = lines[currentIndex].trim();

        // Check if this is a choice line
        const choiceMatch = choiceLine.match(/^\[(\d+)\]\s+(.+)$/);
        if (choiceMatch) {
          const choiceId = parseInt(choiceMatch[1], 10);
          let choiceText = choiceMatch[2].trim();

          // Remove any trailing scene numbers that got concatenated
          choiceText = choiceText.replace(/\s+\d+\.\s+[A-Z].*$/, "");

          choices.push({
            id: choiceId,
            text: choiceText,
          });
          currentIndex++;
        } else if (choiceLine === "" || /^\s*$/.test(choiceLine)) {
          // Skip empty lines
          currentIndex++;
        } else {
          // We've hit something that's not a choice, so break
          break;
        }
      }

      story.scenes.push({
        id: sceneId,
        title: sceneTitle,
        content: content,
        choices: choices,
      });
    } else {
      currentIndex++;
    }
  }

  return story;
}

// Main execution
const storyPath = path.join(
  __dirname,
  "interactive-story",
  "unfinishedStory.md"
);
const story = parseStory(storyPath);

// Output as JSON
const jsonPath = path.join(__dirname, "story.json");
fs.writeFileSync(jsonPath, JSON.stringify(story, null, 2), "utf-8");

console.log(`Story parsed successfully!`);
console.log(`Title: ${story.title}`);
console.log(`Total scenes: ${story.scenes.length}`);
console.log(`Output saved to: ${jsonPath}`);
