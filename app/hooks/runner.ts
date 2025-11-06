import { useCallback, useMemo, useRef,useState } from "react";

import {
  parseMdxToAst,
  parseTree,
  Passage,
  StoryTree,
  Transition,
} from "../../stories/parser";
import { getAllStoryCodes,loadStory } from "../actions";

interface CYOARunnerState {
  representation: StoryTree;
  isDone: boolean;
  currentPassageName: string;
  currentPassage: Passage;
  inventory: Record<string, unknown>;
}

type TransitionCriteriaFunction = (inventory: object) => boolean;

function isValidTransition(
  criteria: string,
  inventory: Record<string, unknown>
): boolean {
  const validatorFunction = new Function(
    "inventory",
    `return Boolean(${criteria})`
  ) as TransitionCriteriaFunction;
  return validatorFunction(inventory);
}

type MetaData = {
  [key: string]: Record<string, unknown>;
};

export async function getAllStoryMetadata() {
  const storyCodes = await getAllStoryCodes();
  const storyMetadata: MetaData = {};
  for (const code of storyCodes) {
    try {
      const storyContent = await loadStory(code);
      const metaData: Record<string, unknown> =
        parseTree(parseMdxToAst(storyContent)).metaData || {};
      storyMetadata[code] = metaData;
    } catch (e) {
      console.error(`Failed to load story metadata for code: ${code}`, e);
    }
  }
  return storyMetadata;
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
         
        const inventory = stateRef.current.inventory;

        return stateRef.current.currentPassage.transitions.filter(function (
          transition: Transition
        ) {
          if (
            transition.transitionCriteria === null ||
            transition.transitionCriteria === undefined ||
            inventory === undefined ||
            inventory === null
          ) {
            return true;
          }
          return isValidTransition(transition.transitionCriteria, inventory);
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
