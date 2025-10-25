import type { GameData } from "./types";

export const gameData: GameData = {
  map: [
    "        [ ]    \n" +
      "         |     \n" +
      "    [x]-[ ]-[ ]\n" +
      "         |     \n" +
      "        [ ]",

    "        [ ]    \n" +
      "         |     \n" +
      "    [ ]-[x]-[ ]\n" +
      "         |     \n" +
      "        [ ]",

    "        [x]    \n" +
      "         |     \n" +
      "    [ ]-[ ]-[ ]\n" +
      "         |     \n" +
      "        [ ]",

    "        [ ]    \n" +
      "         |     \n" +
      "    [ ]-[ ]-[x]\n" +
      "         |     \n" +
      "        [ ]",

    "        [ ]    \n" +
      "         |     \n" +
      "    [ ]-[ ]-[ ]\n" +
      "         |     \n" +
      "        [x]",
  ],

  rooms: [
    {
      description:
        "You are in a small room that looks like an old office. There is a door to the east.",
      objects: [
        {
          object: "DRAWER",
          check: "n",
          item: "random",
          open: 0,
          pickedUp: 0,
        },
        {
          object: "CABINET",
          check: "ST",
          item: "AMMO",
          open: 0,
          pickedUp: 0,
        },
      ],
      items: [
        { item: "AMMO", location: "chair", pickedUp: 0 },
        { item: "STIMPACK", location: "table", pickedUp: 0 },
      ],
      doors: ["x", "e", "x", "x"],
      key: [0, 0, 0, 0],
      doorRoomNos: [-1, 1, -1, -1],
    },
    {
      description:
        "You enter the room. There are doors at NORTH EAST SOUTH WEST. It appears to be a lobby. In it are some comfy chairs that have been torn open and a reception desk with a sign in book open upon it. A burst pipe leaks sewage down the walls.",
      objects: [
        {
          object: "LOCKER",
          check: "n",
          item: "random",
          open: 0,
          pickedUp: 0,
        },
      ],
      items: [{ item: "BATTERIES", location: "chair", pickedUp: 0 }],
      doors: ["n", "e", "s", "w"],
      key: ["B10-KEY", 0, 0, 0],
      doorRoomNos: [2, 4, 3, 0],
    },
    {
      description:
        "You are in a long corridor running North to South, there is not much to this place. Windows of offices line the walls and an old Employee of the Month plaque sits on a notice board but the face has been crossed out in marker pen",
      items: [{ item: "MEDS", location: "floor", pickedUp: 0 }],
      doors: ["x", "x", "s", "x"],
      key: [0, 0, 0, 0],
      doorRoomNos: [-1, -1, 1, -1],
    },
    {
      description:
        "This appears to be a boiler room with the funance long since dead, evidence of a fire has been in here",
      objects: [
        {
          object: "FURNACE",
          check: "ST",
          item: "random",
          open: 0,
          pickedUp: 0,
        },
        {
          object: "TOOLBOX",
          check: "n",
          item: "ammo",
          open: 0,
          pickedUp: 0,
        },
      ],
      items: [{ item: "B10-KEY", location: "chair", pickedUp: 0 }],
      doors: ["n", "x", "x", "x"],
      key: [0, 0, 0, 0],
      doorRoomNos: [1, -1, -1, -1],
    },
    {
      description:
        "You emerge into a large atrium space with an old glass ceiling that has long since shattered. Broken glass lies all around and you hear the sounds of beasts high above you",
      objects: [
        {
          object: "VENDING MACHINE",
          check: "ST",
          item: "random",
          open: 0,
          pickedUp: 0,
        },
        {
          object: "CLOSET",
          check: "n",
          item: "ammo",
          open: 0,
          pickedUp: 0,
        },
      ],
      items: [
        { item: "AMMO", location: "table", pickedUp: 0 },
        { item: "BATTERIES", location: "plantpot", pickedUp: 0 },
      ],
      doors: ["x", "x", "x", "w"],
      key: [0, 0, 0, 0],
      doorRoomNos: [-1, -1, -1, 1],
    },
  ],

  monsters: [
    {
      name: "Chokespawn",
      hp: 20,
      maxhp: 20,
      roomNo: 3,
      dmg: 1,
      combat: 40,
    },
    {
      name: "Grotesque",
      hp: 50,
      maxhp: 50,
      roomNo: 4,
      dmg: 3,
      combat: 70,
    },
    {
      name: "Diamond Dog",
      hp: 10,
      maxhp: 10,
      roomNo: 1,
      dmg: 2,
      combat: 30,
    },
  ],
};
