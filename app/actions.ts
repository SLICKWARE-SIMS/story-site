"use server";

import fs from "fs/promises";
import path from "path";

export async function loadStory(storyCode: string): Promise<string> {
  try {
    const storyPath = path.join(process.cwd(), "stories", `${storyCode}.mdx`);
    const content = await fs.readFile(storyPath, "utf-8");
    return content;
  } catch (error) {
    console.error("Error loading story:", error);
    throw new Error("Failed to load story");
  }
}

export async function getAllStoryCodes(): Promise<Array<string>> {
  const storyDir = path.join(process.cwd(), "stories");
  const fileNames = await fs.readdir(storyDir);
  return fileNames
    .filter(function (fileName) {
      return fileName.endsWith(".mdx") && fileName != "example.mdx";
    })
    .map((storyFileName) => storyFileName.slice(0, -4));
}