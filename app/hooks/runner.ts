import { useState, useCallback, useMemo, useRef } from "react";
import {
  parseMdxToAst,
  parseTree,
  Passage,
  StoryTree,
  Transition,
} from "../../stories/parser";
import { loadStory } from "../actions";

interface CYOARunnerState {
  representation: StoryTree;
  isDone: boolean;
  currentPassageName: string;
  currentPassage: Passage;
  inventory: Record<string, unknown>;
}

export function useCYOARunner() {
  const stateRef = useRef<CYOARunnerState | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const loadStoryIntoCYOA = async (storyCode: string) => {
    setIsLoaded(false);
    const storyContent = await loadStory(storyCode);

    // Parse for the CYOA runner
    const ast = parseMdxToAst(storyContent);
    const representation = parseTree(ast);

    // Initialize the state
    const currentPassageName = Object.keys(representation.passages)[0];
    const currentPassage = representation.passages[currentPassageName];
    const inventory: Record<string, unknown> = {};

    // Execute initialization scripts
    const executeAll = (arr: string[], inv: Record<string, unknown>) => {
      // defining inventory just so eval can use it
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const inventory = inv;
      arr.forEach((statement: string) => {
        // eslint-disable-next-line no-eval
        eval(statement);
      });
    };

    executeAll(representation.initializationScript, inventory);
    executeAll(currentPassage.initializationScript, inventory);

    const newState = {
      representation,
      isDone: false,
      currentPassageName,
      currentPassage,
      inventory,
    };

    stateRef.current = newState;
    setIsLoaded(true);
  };

  const transition = useCallback((passageName: string) => {
    if (!stateRef.current) return;

    const prevState = stateRef.current;
    const newPassage = prevState.representation.passages[passageName];
    const newInventory = { ...prevState.inventory };

    // Execute passage initialization script
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const inventory = newInventory;
    newPassage.initializationScript.forEach((statement: string) => {
      // eslint-disable-next-line no-eval
      eval(statement);
    });

    const isDone = newPassage.transitions.length === 0;

    const newState = {
      ...prevState,
      currentPassageName: passageName,
      currentPassage: newPassage,
      inventory: newInventory,
      isDone,
    };

    stateRef.current = newState;
  }, []);

  const runner = useMemo(
    () => ({
      isLoaded,
      loadStory: loadStoryIntoCYOA,
      get passageText() {
        return stateRef.current?.currentPassage.text;
      },
      get isDone() {
        return stateRef.current?.isDone;
      },
      get inventory() {
        return stateRef.current?.inventory;
      },
      get transitionOptions() {
        if (!stateRef.current) return [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const inventory = stateRef.current.inventory;

        return stateRef.current.currentPassage.transitions.filter(function (
          transition: Transition
        ) {
          const transitionCopy = { ...transition };
          if (transitionCopy.transitionCriteria !== null) {
            // eslint-disable-next-line no-eval
            transitionCopy.isValid = eval(transitionCopy.transitionCriteria);
          } else {
            transitionCopy.isValid = true;
          }
          return transitionCopy;
        });
      },
      get passageName() {
        return stateRef.current?.currentPassageName;
      },
      transition,
    }),
    [isLoaded, loadStoryIntoCYOA, transition]
  );

  return runner;
}
