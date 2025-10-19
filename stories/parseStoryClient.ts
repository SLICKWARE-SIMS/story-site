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

export function parseStory(content: string): Story {
  const lines = content.split("\n");
  let currentIndex = 0;
  const story: Story = {
    title: "",
    introduction: "",
    scenes: [],
  };
  const seenSceneIds = new Set<number>();

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
  story.introduction = introLines.join("\n").trim();

  // Parse scenes
  while (currentIndex < lines.length) {
    const line = lines[currentIndex].trim();

    // Look for scene headers like "1. START", "2. SURPRISE SOUP"
    const sceneMatch = line.match(/^(\d+)\.\s+([A-Z].*)$/);
    if (sceneMatch && line === line.trim()) {
      const sceneId = parseInt(sceneMatch[1], 10);
      let sceneTitle = sceneMatch[2].trim();

      // Remove any trailing scene number if it got attached
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

        // Check if this is the next scene header
        if (/^\d+\.\s+[A-Z]/.test(trimmed)) {
          break;
        }

        contentLines.push(contentLine);
        currentIndex++;
      }

      const content = contentLines.join("\n").trim();

      // Parse choices
      const choices: Choice[] = [];
      while (currentIndex < lines.length) {
        const choiceLine = lines[currentIndex].trim();

        // Check if this is a choice line
        const choiceMatch = choiceLine.match(/^\[(\d+)\]\s+(.+)$/);
        if (choiceMatch) {
          const choiceId = parseInt(choiceMatch[1], 10);
          let choiceText = choiceMatch[2].trim();

          // Remove any trailing scene numbers
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
          // We've hit something that's not a choice
          break;
        }
      }

      // Validate unique scene ID
      if (seenSceneIds.has(sceneId)) {
        throw new Error(
          `Duplicate scene ID found: ${sceneId}. Scene IDs must be unique.`
        );
      }
      seenSceneIds.add(sceneId);

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

export type { Story, Scene, Choice };
