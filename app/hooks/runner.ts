import { Passage, StoryTree, Transition } from "../../stories/parser";

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
