"use server";

import fs from "fs/promises";
import path from "path";

export async function loadStory(storyCode: string): Promise<string> {
  try {
    const storyPath = path.join(process.cwd(), "stories", `${storyCode}.md`);
    const content = await fs.readFile(storyPath, "utf-8");
    return content;
  } catch (error) {
    console.error("Error loading story:", error);
    throw new Error("Failed to load story");
  }
}
