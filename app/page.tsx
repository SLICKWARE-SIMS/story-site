"use client";

import { Terminal, useEventQueue, textLine, textWord } from "crt-terminal";
import styled from "styled-components";
import { useEffect, useMemo, useState } from "react";
import { type StoryTree } from "../stories/parser";
import { useGoogleSheet } from "./hooks/useGoogleSheet";
import { useCYOARunner } from "./hooks/runner";
import { bannerLogo } from "./banner";

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
${bannerLogo}

Available commands:

- login:        Login and start a new story
- demo:         Start demo mode (limited actions)
- help:         Show this help message
- inventory:    View your inventory (when in a story)
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
  // ";",
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

function getInventoryDisplayText(
  inventory: Record<string, unknown> | undefined
) {
  if (inventory === undefined) {
    return ["  Empty"];
  }
  const displayText = [];
  for (const [key, value] of Object.entries(inventory)) {
    if (value) {
      displayText.push(`  ${key}: ${value}`);
    }
  }
  return displayText;
}

const MAX_DEMO_ACTIONS = 10;
export default function Home() {
  const { data } = useGoogleSheet(
    "1S7Zvw3-ltXztRLR9fH60jIa8Qb8NDT82KNsGQcRYHlg"
  );
  const eventQueue = useEventQueue();
  const { print } = eventQueue.handlers;
  const [loginStep, setLoginStep] = useState<
    null | "story" | "access" | "hardwareCheck"
  >(null);
  const [_userName, setUserName] = useState("");
  const [storyCode, setStoryCode] = useState("");
  const simulations = ["blackMarket"]
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [actionCount, setActionCount] = useState(0);

  // Use the CYOA runner hook when we have a story tree
  const runner = useCYOARunner();

  const codes = useMemo(() => {
    if (!data) return [];
    return data.map((row) => row["6 Character"]);
  }, [data]);

  const accessCodeToName = new Map();

  data.forEach(function f(row) {
    if ("DISCORD" in row && row["DISCORD"]){
      accessCodeToName.set(row["6 Character"].toString(), row["DISCORD"])
      accessCodeToName.set(row["SHA-256 Serial"].toString(), row["DISCORD"])
    }
  })

  const printPassage = () => {
    if (!runner) return;

    print([
      textLine({
        words: [
          textWord({
            characters: "\n" + runner?.passageText?.join("\n\n") + "\n",
          }),
        ],
      }),
      textLine({ words: [textWord({ characters: "\nAvailable choices:" })] }),
      ...runner.transitionOptions.map((option, idx) =>
        textLine({
          words: [textWord({ characters: `[${idx + 1}] ${option.text}` })],
        })
      ),
    ]);
  };

  useEffect(() => {
    // if the story wasn't loaded last render
    // but is loaded now, print the passage
    if (runner?.isLoaded && !runner?.isDone) {
      printPassage();
    }
  }, [runner?.isLoaded]);

  // Disable autocomplete on the terminal input
  useEffect(() => {
    const input = document.querySelector(".crt-terminal input");
    if (input) {
      input.setAttribute("autocomplete", "off");
    }
  }, []);

  const handleCommand = async (command: string) => {
    if (sqlCheck(command)) {
      return resolveBelligerentUser();
    }

    if (command === "demo") {
      setLoginStep("story");
      setIsDemoMode(true);
      setActionCount(0);

      print([
        textLine({
          words: [
            textWord({
              characters: `Demo mode activated. You have ${MAX_DEMO_ACTIONS} actions.`,
            }),
          ],
        }),
      ]);

      print([
        textLine({
          words: [
            textWord({
              characters: "Choose a Simulation™",
            }),
          ],
        }),
      ]);

      simulations.forEach( (simulation) => {
        print([
          textLine({
            words: [
              textWord({
                characters: `  - ${simulation}`,
              }),
            ],
          }),
        ]);
      })

      return;
    }

    if (command === "runner") {
      if (runner && runner.isLoaded) {
        print([
          textLine({
            words: [
              textWord({
                characters: `\n=== CYOA Runner State ===`,
              }),
            ],
          }),
          textLine({
            words: [
              textWord({
                characters: `\nPassage Text:\n${
                  runner?.passageText?.join("\n") || ""
                }\n`,
              }),
            ],
          }),
          textLine({
            words: [
              textWord({
                characters: `\nAvailable Transitions:`,
              }),
            ],
          }),
          ...runner.transitionOptions.map((option, idx) =>
            textLine({
              words: [
                textWord({
                  characters: `[${idx + 1}] ${option.text} -> ${option.header}`,
                }),
              ],
            })
          ),
          textLine({
            words: [
              textWord({
                characters: `\nStory Complete: ${
                  runner.isDone ? "Yes" : "No"
                }\n`,
              }),
            ],
          }),
        ]);
        return;
      } else {
        print([
          textLine({
            words: [
              textWord({
                characters: "No story loaded. Type 'login' to start.",
              }),
            ],
          }),
        ]);
        return;
      }
    }

    if (loginStep === "hardwareCheck") {
      setLoginStep(null);
      if (!command.toLowerCase().includes("y")) {
        return
      }

      await runner.loadStory(storyCode);

      print([
        textLine({
          words: [textWord({ characters: "\nSimulation™ loaded successfully!\n" })],
        }),
      ]);
      return
    }

    if (loginStep === "story") {
      if (!(simulations.includes(command))) {
        print([
          textLine({
            words: [
              textWord({
                characters: "Invalid simulation code. Type again.",
              }),
            ],
          }),
        ]);
        setLoginStep("story");
        return
      }

      setStoryCode(command);
      setLoginStep("hardwareCheck");


      print([
        textLine({
          words: [
            textWord({
              characters: "Beginning Simulation™...",
            }),
          ],
        }),
      ]);

      print([
        textLine({
          words: [
            textWord({
              characters: "ERROR: SLICKWARE NOT DETECTED",
            }),
          ],
        }),
        textLine({
          words: [
            textWord({
              characters: "A text interface will be provided for debugging purposes.",
            }),
          ],
        }),
        textLine({
          words: [
            textWord({
              characters: "WARNING: SIMULATIONS MAY CONTAIN TRIGGERING CONTENT:",
            }),
          ],
        }),
        textLine({
          words: [
            textWord({
              characters: "  - BODY HORROR",
            }),
          ],
        }),
        textLine({
          words: [
            textWord({
              characters: "  - VIOLENCE",
            }),
          ],
        }),
        textLine({
          words: [
            textWord({
              characters: "  - ADDICTION",
            }),
          ],
        }),
        textLine({
          words: [
            textWord({
              characters: "  - DISEASE",
            }),
          ],
        }),
        textLine({
          words: [
            textWord({
              characters: "Proceed? (Y/n)",
            }),
          ],
        }),
      ]);

      return
    }

    if (loginStep === "access") {
      setLoginStep("story");
      try {
        // Check access code
        const codesToCheck =
          process.env.NODE_ENV === "development" ? ["asdf"] : [];
        const isFullAccess = [...codesToCheck, ...Array.from(accessCodeToName.keys())].includes(
          command.toLowerCase()
        );
        setStoryCode("blackMarket")

        print([
            textLine({
              words: [
                textWord({
                  characters: `AUTHENTICATING`,
                }),
              ],
            }),
          ]);

        if (!isFullAccess) {
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

        const name = accessCodeToName.get(command)
        if (name.includes("beefstink")) {
          return resolveBelligerentUser();
        }

        print([
            textLine({
              words: [
                textWord({
                  characters: `Welcome ${name}`,
                }),
              ],
            }),
          ]);

      print([
        textLine({
          words: [
            textWord({
              characters: "Choose a Simulation™",
            }),
          ],
        }),
      ]);

      simulations.forEach( (simulation) => {
        print([
          textLine({
            words: [
              textWord({
                characters: `  - ${simulation}`,
              }),
            ],
          }),
        ]);
      })

      return


        if (isDemoMode) {
          print([
            textLine({
              words: [
                textWord({
                  characters: `[Demo mode: You have ${MAX_DEMO_ACTIONS} actions]`,
                }),
              ],
            }),
          ]);
        }
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

    if (runner.isLoaded && !runner.isDone) {
      if (command == "inventory") {
        print([
          textLine({
            words: getInventoryDisplayText(runner.inventory).map(
              (displayText) =>
                textWord({
                  characters: displayText,
                })
            ),
          }),
        ]);
        return;
      }

      const choiceNum = parseInt(command, 10);
      const choice = runner.transitionOptions[choiceNum - 1];

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

      // Make the transition
      runner.transition(choice.header);
      if (isDemoMode) {
        const newActionCount = actionCount + 1;
        setActionCount(Math.min(newActionCount, MAX_DEMO_ACTIONS));
        if (newActionCount < MAX_DEMO_ACTIONS) {
          print([
            textLine({
              words: [
                textWord({
                  characters: `[Demo mode: You have ${
                    MAX_DEMO_ACTIONS - newActionCount
                  } actions remaining]`,
                }),
              ],
            }),
          ]);
        } else {
          print([
            textLine({
              words: [
                textWord({
                  characters: `You have reached the end of the demo content.  Please purchase an access code to continue.`,
                }),
              ],
            }),
          ]);
          return;
        }
      }

      printPassage();

      if (runner.isDone) {
        print([
          textLine({
            words: [
              textWord({
                characters: `\n[STORY COMPLETE]\nType 'login' to play again.`,
              }),
            ],
          }),
        ]);
      }
      return;
    }

    switch (command.toLowerCase()) {
      case "login":
        setLoginStep("access");
        print([
          textLine({
            words: [textWord({ characters: "Please enter your credentials:" })],
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
- inventory : View your inventory
- help : Show this help message`,
              }),
            ],
          }),
        ]);
        break;
      case "inventory":
        if (runner) {
          if (!runner.inventory || Object.keys(runner.inventory).length === 0) {
            print([
              textLine({
                words: [
                  textWord({
                    characters: "Your inventory is empty.\n",
                  }),
                ],
              }),
            ]);
            break;
          }

          // remove empty inventory items
          print(
            Object.entries(runner.inventory)
              .filter(([_, v]) => !!v)
              .map(([key, value]) =>
                textLine({
                  words: [textWord({ characters: `${key}: ${value}` })],
                })
              )
          );
        } else {
          print([
            textLine({
              words: [
                textWord({
                  characters: "No story loaded. Type 'login' to start.",
                }),
              ],
            }),
          ]);
        }
        break;
      case "dev": {
        if (process.env.NODE_ENV === "development") {
          setUserName("SomeKittens");
          setStoryCode("blackMarket");
          await runner.loadStory("blackMarket");

          print([
            textLine({
              words: [textWord({ characters: "\nStory loaded (dev mode)!\n" })],
            }),
          ]);
          // printPassage();
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
