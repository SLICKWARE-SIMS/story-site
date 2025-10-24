"use client";

import { Terminal, useEventQueue, textLine, textWord } from "crt-terminal";
import styled from "styled-components";
import { useMemo, useState } from "react";
import { loadStory } from "./actions";
import {
  parseStory,
  type Story,
  type Scene,
} from "../stories/parseStoryClient";
import { useGoogleSheet } from "./hooks/useGoogleSheet";
import { useInventory } from "./hooks/useInventory";

const PageContainer = styled.div`
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #000;

  @media (max-width: 767px) {
    .crt-terminal {
      margin: 0;
      padding: 0;
      border: none;
    }
  }

  .crt-character {
    word-break: break-word;
  }
`;

const bannerText = `
   ▄▄▄▄▄▄    ▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄            ▄▄         ▄▄▄▄▄▄   ▄▄▄  ▄▄▄   ▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄    ▄▄▄▄
  ██▀▀▀▀██   ██▀▀▀▀▀▀  ██▀▀▀▀▀▀            ██         ▀▀██▀▀   ███  ███   ▀▀██▀▀   ▀▀▀██▀▀▀  ▄█▀▀▀▀█
 ██▀█▄   ██  ██        ██                  ██           ██     ████████     ██        ██     ██▄
 ██  ▀▄  ██  ███████   ███████             ██           ██     ██ ██ ██     ██        ██      ▀████▄
 ██   ▀█▄██  ██        ██                  ██           ██     ██ ▀▀ ██     ██        ██          ▀██
  ██▄▄▄▄██   ██        ██                  ██▄▄▄▄▄▄   ▄▄██▄▄   ██    ██   ▄▄██▄▄      ██     █▄▄▄▄▄█▀
   ▀▀▀▀▀▀    ▀▀        ▀▀                  ▀▀▀▀▀▀▀▀   ▀▀▀▀▀▀   ▀▀    ▀▀   ▀▀▀▀▀▀      ▀▀      ▀▀▀▀▀

=======================================

Available commands:
- login : Login and start a new story
- help : Show this help message
`;

const sqlKeywords = [
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "CREATE",
  "EXEC",
  // "UNION", union is ok
  "WHERE",
  "FROM",
  "JOIN",
  "--",
  ";",
  "/*",
  "*/",
];
const sqlCheck = (command: string) => {
  const upperCommand = command.toUpperCase();
  return sqlKeywords.some((keyword) => upperCommand.includes(keyword));
};

const resolveBelligerentUser = () => {
  window.location.href = atob(
    "aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1kUXc0dzlXZ1hjUQ=="
  );
};

export default function Home() {
  const { data } = useGoogleSheet(
    "1S7Zvw3-ltXztRLR9fH60jIa8Qb8NDT82KNsGQcRYHlg"
  );
  const { inventory } = useInventory();
  const eventQueue = useEventQueue();
  const { print } = eventQueue.handlers;
  const [loginStep, setLoginStep] = useState<
    null | "name" | "story" | "access"
  >(null);
  const [_userName, setUserName] = useState("");
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [scenesPlayed, setScenesPlayed] = useState(0);
  const [storyCode, setStoryCode] = useState("");

  const codes = useMemo(() => {
    if (!data) return [];
    return data.map((row) => row["6 Character"]);
  }, [data]);

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
    if (sqlCheck(command)) {
      return resolveBelligerentUser();
    }
    if (loginStep === "name") {
      if (command.toLowerCase().includes("beefstink")) {
        return resolveBelligerentUser();
      }
      setUserName(command);
      setLoginStep("story");
      print([
        textLine({
          words: [
            textWord({
              characters: `Welcome, ${command}! Please enter your story code:`,
            }),
          ],
        }),
      ]);
      return;
    }

    if (loginStep === "story") {
      // TODO: some validation of story code
      // right now there's just one story
      setStoryCode(command);
      setLoginStep("access");
      print([
        textLine({
          words: [
            textWord({
              characters: "Now enter your access code:",
            }),
          ],
        }),
      ]);
      return;
    }

    if (loginStep === "access") {
      setLoginStep(null);
      try {
        const storyContent = await loadStory(storyCode);
        const parsedStory = parseStory(storyContent);
        setStory(parsedStory);

        // Check access code to determine demo mode
        const isDemoAccess = command.toLowerCase() === "demo";
        const codesToCheck =
          process.env.NODE_ENV === "development" ? ["asdf"] : [];
        const isFullAccess = [...codesToCheck, ...codes].includes(
          command.toLowerCase()
        );

        if (!isDemoAccess && !isFullAccess) {
          print([
            textLine({
              words: [
                textWord({
                  characters: "Invalid access code. Type 'login' to try again.",
                }),
              ],
            }),
          ]);
          return;
        }

        setDemoMode(isDemoAccess);
        setScenesPlayed(1);

        const modeText = isDemoAccess
          ? "\n[DEMO MODE - 10 scenes limit]"
          : "\nStory loaded successfully!";
        const outputLines = [
          textLine({
            words: [textWord({ characters: modeText })],
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
        ];

        if (isDemoAccess) {
          outputLines.push(
            textLine({
              words: [textWord({ characters: "[Scene 1/10]" })],
            })
          );
        }

        print(outputLines);
        setCurrentScene(parsedStory.scenes[0]);
        printScene(parsedStory.scenes[0]);
      } catch (error: unknown) {
        let errMessage = "";
        if (error instanceof Error) {
          errMessage = error.message;
        }

        // Error loading story
        const errArray = [
          textLine({
            words: [
              textWord({
                characters:
                  "Error loading story. Please Type 'login' to try again.",
              }),
            ],
          }),
        ];
        if (errMessage) {
          errArray.unshift(
            textLine({
              words: [
                textWord({
                  characters: errMessage,
                }),
              ],
            })
          );
        }
        print(errArray);
        console.error(error);
      }
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

      // Check if demo mode has reached 10 scenes
      if (demoMode && scenesPlayed >= 10) {
        print([
          textLine({
            words: [
              textWord({
                characters: `\n[DEMO MODE ENDED]\nYou have explored 10 scenes. Type 'login' to try the full story or play again.`,
              }),
            ],
          }),
        ]);
        setCurrentScene(null);
        setStory(null);
        setDemoMode(false);
        setScenesPlayed(0);
        return;
      }

      // Find and display the next scene
      const nextScene = story?.scenes.find((s) => s.id === choice.id);
      if (nextScene) {
        const newSceneCount = scenesPlayed + 1;
        setScenesPlayed(newSceneCount);
        setCurrentScene(nextScene);

        // Print scene counter in demo mode
        if (demoMode) {
          print([
            textLine({
              words: [textWord({ characters: `[Scene ${newSceneCount}/10]` })],
            }),
          ]);
        }

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
      case "inventory":
        print([
          textLine({
            words: [
              textWord({
                characters: `\nCREDITS: ${inventory.credits}\n`,
              }),
            ],
          }),
          textLine({
            words: [
              textWord({
                characters: `ITEMS (${inventory.items.length}):`,
              }),
            ],
          }),
          ...(inventory.items.length > 0
            ? inventory.items.map((item) =>
                textLine({
                  words: [textWord({ characters: `  - ${item}` })],
                })
              )
            : [
                textLine({
                  words: [textWord({ characters: "  (empty)" })],
                }),
              ]),
        ]);
        break;
      case "dev": {
        if (process.env.NODE_ENV === "development") {
          setUserName("SomeKittens");
          setStoryCode("blackMarket");
          const storyContent = await loadStory("blackMarket");
          const parsedStory = parseStory(storyContent);
          setStory(parsedStory);

          setCurrentScene(parsedStory.scenes[0]);
          printScene(parsedStory.scenes[0]);
          break;
        }
      }
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
    <PageContainer>
      <Terminal
        queue={eventQueue}
        banner={[textLine({ words: [textWord({ characters: bannerText })] })]}
        onCommand={handleCommand}
        effects={{
          screenEffects: false,
        }}
      />
    </PageContainer>
  );
}
