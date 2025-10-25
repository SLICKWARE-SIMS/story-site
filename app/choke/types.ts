export interface RoomObject {
  object: string;
  check: string;
  item: string;
  open: number;
  pickedUp: number;
}

export interface RoomItem {
  item: string;
  location: string;
  pickedUp: number;
}

export interface Room {
  description: string;
  objects?: RoomObject[];
  items?: RoomItem[];
  doors: string[];
  key: (string | number)[];
  doorRoomNos: number[];
}

export interface Monster {
  name: string;
  hp: number;
  maxhp: number;
  roomNo: number;
  dmg: number;
  combat: number;
}

export interface EquipmentItem {
  item: string;
  number: number;
}

export interface GameData {
  map: string[];
  rooms: Room[];
  monsters: Monster[];
}
