import { useState, useCallback, useMemo } from "react";
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
  const [state, setState] = useState<CYOARunnerState>();
  const [isLoaded, setIsLoaded] = useState(false);
  const loadStoryIntoCYOA = async (storyCode: string) => {
    setIsLoaded(false);
    const storyContent = await loadStory(storyCode);

    // Parse for the CYOA runner
    const ast = parseMdxToAst(storyContent);
    const representation = parseTree(ast);
    console.log("representation: ", representation);

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

    setState({
      representation,
      isDone: false,
      currentPassageName,
      currentPassage,
      inventory,
    });
    setIsLoaded(true);
  };

  const transition = useCallback((passageName: string) => {
    setState((prevState) => {
      if (!prevState) return prevState;
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

      return {
        ...prevState,
        currentPassageName: passageName,
        currentPassage: newPassage,
        inventory: newInventory,
        isDone,
      };
    });
  }, []);

  const transitionOptions = useMemo(() => {
    if (!state) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _inventory = state.inventory;

    return state.currentPassage.transitions.filter(function (
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
  }, [state?.currentPassage, state?.inventory]);

  return {
    isLoaded,
    loadStory: loadStoryIntoCYOA,
    passageText: state?.currentPassage.text,
    isDone: state?.isDone,
    inventory: state?.inventory,
    transitionOptions,
    transition,
  };
}

// Keep the class export for backwards compatibility
export class CYOARunner {
  private _representation: StoryTree;
  private _isDone: boolean;
  private _currentPassageName: string;
  private _currentPassage: Passage;
  private _inventory: Record<string, unknown>;

  constructor(representation: StoryTree) {
    this._representation = representation;
    this._isDone = false;

    // This is grabbing the first key in the JSON as the starting passage
    // Could this produce undefined behavior?
    this._currentPassageName = Object.keys(representation.passages)[0];
    this._currentPassage =
      this._representation.passages[this._currentPassageName];

    this._inventory = {};

    this._executeAll(this._representation.initializationScript);
    this._executeAll(this._currentPassage.initializationScript);
  }

  _executeAll(arr: string[]): void {
    // defining inventory just so eval can use it
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const inventory = this.inventory;
    arr.forEach((statement: string) => {
      // eslint-disable-next-line no-eval
      eval(statement);
    });
  }

  // TODO: figure out how to make this a getter
  // without screwing up the hoisting of inventory before eval
  get inventory(): Record<string, unknown> {
    return this._inventory;
  }

  get passageText() {
    return this._currentPassage.text;
  }

  get isDone() {
    return this._isDone;
  }

  transition(passageName: string): void {
    this._currentPassageName = passageName;
    this._currentPassage = this._representation.passages[passageName];
    this._executeAll(this._currentPassage.initializationScript);
    if (this._currentPassage.transitions.length == 0) {
      this._isDone = true;
    }
  }

  get transitionOptions(): any[] {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _inventory = this._inventory;

    return this._currentPassage.transitions.filter(function (
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
  }
}
