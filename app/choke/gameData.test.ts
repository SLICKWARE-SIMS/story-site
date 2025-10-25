import { describe, it, expect } from "vitest";
import { gameData } from "./gameData";

describe("Choke Game Data", () => {
  it("should have 5 rooms", () => {
    expect(gameData.rooms).toHaveLength(5);
  });

  it("should have 5 map states", () => {
    expect(gameData.map).toHaveLength(5);
  });

  it("should have 3 monsters", () => {
    expect(gameData.monsters).toHaveLength(3);
  });

  it("all rooms should have valid door connections", () => {
    gameData.rooms.forEach((room) => {
      room.doors.forEach((door, doorIdx) => {
        if (door !== "x") {
          const targetRoom = room.doorRoomNos[doorIdx];
          expect(targetRoom).toBeGreaterThanOrEqual(-1);
          expect(targetRoom).toBeLessThan(gameData.rooms.length);
        }
      });
    });
  });

  it("monsters should start in valid rooms", () => {
    gameData.monsters.forEach((monster) => {
      expect(monster.roomNo).toBeGreaterThanOrEqual(0);
      expect(monster.roomNo).toBeLessThan(gameData.rooms.length);
    });
  });

  it("monsters should have positive HP", () => {
    gameData.monsters.forEach((monster) => {
      expect(monster.hp).toBeGreaterThan(0);
      expect(monster.maxhp).toBeGreaterThan(0);
      expect(monster.hp).toBeLessThanOrEqual(monster.maxhp);
    });
  });
});
