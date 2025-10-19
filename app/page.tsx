"use client";

import {
  Terminal,
  useEventQueue,
  textLine,
  textWord,
  commandWord,
} from "crt-terminal";
import styles from "./page.module.css";
import { useState } from "react";
import { loadStory } from "./actions";
import {
  parseStory,
  type Story,
  type Scene,
  type Choice,
} from "../stories/parseStoryClient";

const bannerText = `
Welcome to Slickware Terminal Interface
=======================================
This is an interactive terminal where you can enter commands.
Type 'load' to start a new story, then enter the access code when prompted.

Available commands:
- load : Start a new story
- help : Show this help message

`;

export default function Home() {
  const eventQueue = useEventQueue();
  const { print } = eventQueue.handlers;
  const [waitingForCode, setWaitingForCode] = useState(false);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [story, setStory] = useState<Story | null>(null);

  const printScene = (scene: Scene) => {
    print([
      textLine({
        words: [textWord({ characters: "\n" + scene.title + "\n" })],
      }),
      textLine({ words: [textWord({ characters: scene.content + "\n" })] }),
      textLine({ words: [textWord({ characters: "\nAvailable choices:" })] }),
      ...scene.choices.map((choice) =>
        textLine({
          words: [textWord({ characters: `[${choice.id}] ${choice.text}` })],
        })
      ),
    ]);
  };

  const handleCommand = async (command: string) => {
    if (waitingForCode) {
      setWaitingForCode(false);
      if (command.toLowerCase() === "asdf") {
        try {
          const storyContent = await loadStory();
          const parsedStory = parseStory(storyContent);
          setStory(parsedStory);
          print([
            textLine({
              words: [textWord({ characters: "\nStory loaded successfully!" })],
            }),
            textLine({
              words: [textWord({ characters: "\n" + parsedStory.title })],
            }),
            textLine({
              words: [
                textWord({
                  characters: "\n" + parsedStory.introduction + "\n",
                }),
              ],
            }),
          ]);
          setCurrentScene(parsedStory.scenes[0]);
          printScene(parsedStory.scenes[0]);
        } catch (error) {
          print([
            textLine({
              words: [
                textWord({
                  characters: "Error loading story. Please try again.",
                }),
              ],
            }),
          ]);
        }
        return;
      }
      print([
        textLine({
          words: [
            textWord({ characters: "Invalid code. Type 'load' to try again." }),
          ],
        }),
      ]);
      return;
    }

    if (currentScene) {
      const choiceId = parseInt(command, 10);
      const choice = currentScene.choices.find((c) => c.id === choiceId);

      if (!choice) {
        print([
          textLine({
            words: [
              textWord({
                characters: `Invalid choice. Please select a number from the available options.`,
              }),
            ],
          }),
        ]);
        return;
      }

      // Find and display the next scene
      const nextScene = story?.scenes.find((s) => s.id === choice.id);
      if (nextScene) {
        setCurrentScene(nextScene);
        printScene(nextScene);
      } else {
        print([
          textLine({
            words: [
              textWord({
                characters: `You selected: ${choice.text} (Scene ${choice.id} not found)`,
              }),
            ],
          }),
        ]);
      }
      return;
    }

    switch (command.toLowerCase()) {
      case "load":
        setWaitingForCode(true);
        print([
          textLine({
            words: [
              textWord({ characters: "Please enter the story access code:" }),
            ],
          }),
        ]);
        break;
      case "help":
        print([
          textLine({
            words: [
              textWord({
                characters: `Available commands:
- load : Start a new story
- help : Show this help message`,
              }),
            ],
          }),
        ]);
        break;
      default:
        print([
          textLine({
            words: [
              textWord({
                characters: `Unknown command. Type 'help' for available commands.`,
              }),
            ],
          }),
        ]);
    }
  };

  return (
    <div className={styles.page}>
      <Terminal
        queue={eventQueue}
        banner={[textLine({ words: [textWord({ characters: bannerText })] })]}
        onCommand={handleCommand}
        effects={{
          screenEffects: false,
        }}
      />
    </div>
  );
}
