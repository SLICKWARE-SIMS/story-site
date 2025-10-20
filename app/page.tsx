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

░░░░░░░░      ░░░  ░░░░░░░░        ░░░      ░░░  ░░░░  ░░  ░░░░  ░░░      ░░░       ░░░        ░░░░░░░░░      ░░░        ░░  ░░░░  ░░░      ░░░░░░░░
▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒  ▒▒  ▒▒▒  ▒▒▒  ▒  ▒  ▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒   ▒▒   ▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒
▓▓▓▓▓▓▓▓      ▓▓▓  ▓▓▓▓▓▓▓▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓▓▓▓▓     ▓▓▓▓▓        ▓▓  ▓▓▓▓  ▓▓       ▓▓▓      ▓▓▓▓▓▓▓▓▓▓▓      ▓▓▓▓▓▓  ▓▓▓▓▓        ▓▓▓      ▓▓▓▓▓▓▓▓
█████████████  ██  ███████████  █████  ████  ██  ███  ███   ██   ██        ██  ███  ███  ████████████████████  █████  █████  █  █  ████████  ███████
████████      ███        ██        ███      ███  ████  ██  ████  ██  ████  ██  ████  ██        █████████      ███        ██  ████  ███      ████████

=======================================

Available commands:
- login : Login and start a new story
- help : Show this help message
`;

export default function Home() {
  const eventQueue = useEventQueue();
  const { print } = eventQueue.handlers;
  const [loginStep, setLoginStep] = useState<null | "name" | "code">(null);
  const [userName, setUserName] = useState("");
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
    if (loginStep === "name") {
      if (command.toLowerCase().includes("beefstink")) {
        window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      }
      setUserName(command);
      setLoginStep("code");
      print([
        textLine({
          words: [
            textWord({
              characters: `Welcome, ${command}! Please enter your story access code:`,
            }),
          ],
        }),
      ]);
      return;
    }

    if (loginStep === "code") {
      setLoginStep(null);
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
            textWord({
              characters: "Invalid code. Type 'login' to try again.",
            }),
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
      case "login":
        setLoginStep("name");
        print([
          textLine({
            words: [textWord({ characters: "Please enter your name:" })],
          }),
        ]);
        break;
      case "help":
        print([
          textLine({
            words: [
              textWord({
                characters: `Available commands:
- login : Login and start a new story
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
