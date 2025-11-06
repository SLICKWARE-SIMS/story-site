"use client";

import {
  Terminal,
  useEventQueue,
  textLine,
  textWord,
} from "@jquesnelle/crt-terminal";
import styled from "styled-components";
import { useState, useCallback, useEffect } from "react";
import { useChokeGame } from "./useChokeGame";
import { bannerLogo } from "../banner";

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

Survive the Choke

Available commands:

- info:              displays this info again
- map:               shows your current location
- look:              describes the room
- n e s w:           directions
- kit:               shows current equipment
- stats:             shows current stats
- shoot:             fires your gun in combat
- hit:               uses your close ranged weapon in combat
- pickup ITEM:       picks up an item in CAPS. Item must be spelt in CAPS
- open OBJECT:       opens an object in CAPS. Object must be spelt in CAPS
- listen:            listen for sounds in adjacent rooms. Info given as NeSwH
                     Captitals indice the direction you hear the sound. H means the room you are in.
- stimpack:          use a stimpack to heal and gain [+] on the next 5 rolls
- scan:              use your bioscanner (if you have one). Life signs given as NeSwH
                     Captitals indice the direction you detect biosigns. H means the room you are in.
- meds:              Reduce stress

Type start to begin
`;

export default function ChokePage() {
  const eventQueue = useEventQueue();
  const { print } = eventQueue.handlers;
  const game = useChokeGame();
  const [waitingForInput, setWaitingForInput] = useState<{
    type: "strength" | null;
    callback: (response: string) => void;
  } | null>(null);
  // Disable autocomplete on the terminal input
  useEffect(() => {
    const input = document.querySelector(".crt-terminal input");
    if (input) {
      input.setAttribute("autocomplete", "off");
    }
  }, []);

  const handleCommand = useCallback(
    (command: string) => {
      const cmd = command.toLowerCase();

      // If we're waiting for input, handle it
      if (waitingForInput) {
        const { callback } = waitingForInput;
        setWaitingForInput(null);
        callback(command);
        return;
      }

      // Handle game commands
      switch (cmd) {
        case "start":
          print([
            textLine({
              words: [
                textWord({
                  characters: "\n" + game.getRoomDescription() + "\n",
                }),
              ],
            }),
          ]);
          break;

        case "map":
          print([
            textLine({
              words: [textWord({ characters: "\n" + game.getMap() + "\n" })],
            }),
          ]);
          break;

        case "look":
          print([
            textLine({
              words: [
                textWord({
                  characters: "\n" + game.getRoomDescription() + "\n",
                }),
              ],
            }),
          ]);
          break;

        case "kit":
          print([
            textLine({
              words: [textWord({ characters: "\n" + game.getInventory() })],
            }),
          ]);
          break;

        case "stats":
          print([
            textLine({
              words: [textWord({ characters: "\n" + game.getStats() + "\n" })],
            }),
          ]);
          break;

        case "n":
        case "e":
        case "s":
        case "w": {
          const result = game.move(cmd);
          print([
            textLine({
              words: [textWord({ characters: "\n" + result + "\n" })],
            }),
          ]);
          break;
        }

        case "shoot": {
          const result = game.shoot();
          print([
            textLine({
              words: [textWord({ characters: "\n" + result + "\n" })],
            }),
          ]);
          break;
        }

        case "hit": {
          const result = game.hit();
          print([
            textLine({
              words: [textWord({ characters: "\n" + result + "\n" })],
            }),
          ]);
          break;
        }

        case "listen": {
          const result = game.listen();
          print([
            textLine({
              words: [textWord({ characters: "\n" + result + "\n" })],
            }),
          ]);
          break;
        }

        case "scan": {
          const result = game.scan();
          print([
            textLine({
              words: [textWord({ characters: "\n" + result + "\n" })],
            }),
          ]);
          break;
        }

        case "stimpack": {
          const result = game.useStimpack();
          print([
            textLine({
              words: [textWord({ characters: "\n" + result + "\n" })],
            }),
          ]);
          break;
        }

        case "meds": {
          const result = game.useMeds();
          print([
            textLine({
              words: [textWord({ characters: "\n" + result + "\n" })],
            }),
          ]);
          break;
        }

        case "info":
        case "help":
          print([
            textLine({
              words: [textWord({ characters: "\n" + bannerText })],
            }),
          ]);
          break;

        default:
          // Check if it's a pickup command
          if (cmd.startsWith("pickup ")) {
            const item = command.substring(7).toUpperCase();
            const result = game.pickup(item);
            print([
              textLine({
                words: [textWord({ characters: "\n" + result + "\n" })],
              }),
            ]);
          }
          // Check if it's an open command
          else if (cmd.startsWith("open ")) {
            const object = command.substring(5).toUpperCase();
            const openResult = game.tryOpen(object);

            if (openResult.needsStrengthCheck) {
              // Ask for confirmation
              print([
                textLine({
                  words: [
                    textWord({
                      characters:
                        "\nIt is stuck shut, you will need to perform a strength check to open it. Would you like to do this? Y/N:",
                    }),
                  ],
                }),
              ]);
              setWaitingForInput({
                type: "strength",
                callback: (response: string) => {
                  const result = game.openWithStrengthCheck(
                    object,
                    response.toUpperCase()
                  );
                  print([
                    textLine({
                      words: [textWord({ characters: "\n" + result + "\n" })],
                    }),
                  ]);
                },
              });
            } else {
              print([
                textLine({
                  words: [textWord({ characters: "\n" + openResult.message })],
                }),
              ]);
            }
          } else {
            print([
              textLine({
                words: [
                  textWord({
                    characters:
                      "Unknown command. Type 'info' or 'help' for available commands.",
                  }),
                ],
              }),
            ]);
          }
      }
    },
    [game, print, waitingForInput]
  );

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
