import { useCallback, useState } from 'react';

import { gameData } from './gameData';
import type {
  EquipmentItem,
  Monster,
  Room,
  RoomItem,
  RoomObject,
} from './types';

// big, terrifying ball of state for the choke game
// TODO: refactor to smaller hooks?
// and/or useReducer?
// or possibly even make this pluggable?
export function useChokeGame() {
  const [roomNo, setRoomNo] = useState(0);
  const [HP, setHP] = useState(100);
  const [Stress, setStress] = useState(0);
  const [ST] = useState(80);
  const [SP] = useState(80);
  const [IN] = useState(80);
  const [CO] = useState(80);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_combat, setCombat] = useState(0);
  const [advantage, setAdvantage] = useState(0);

  const [ranged, setRanged] = useState({ name: 'Shotgun', dmg: 4, ammo: 4 });
  const [close] = useState({ name: 'Boarding Axe', dmg: 2 });

  const [equipment, setEquipment] = useState<EquipmentItem[]>([
    { item: 'STIMPACK', number: 3 },
    { item: 'FLASHLIGHT', number: 100 },
    { item: 'Bioscanner', number: 10 },
    { item: 'MEDS', number: 1 },
    { item: 'BATTERIES', number: 0 },
  ]);

  const [rooms, setRooms] = useState<Room[]>(gameData.rooms);
  const [monsters, setMonsters] = useState<Monster[]>(gameData.monsters);

  // Dice rolling functions
  const d100 = useCallback(() => {
    if (advantage > 0) {
      setAdvantage((prev) => prev - 1);
      const d1 = Math.floor(Math.random() * 100);
      const d2 = Math.floor(Math.random() * 100);
      return Math.max(d1, d2);
    }
    return Math.floor(Math.random() * 100);
  }, [advantage]);

  const Xd10 = useCallback((x: number) => {
    let total = 0;
    for (let d = 0; d < x; d++) {
      total += Math.floor(Math.random() * 10) + 1;
    }
    return total;
  }, []);

  const upkeep = useCallback(() => {
    setEquipment((prev) =>
      prev.map((item, idx) =>
        idx === 1 ? { ...item, number: item.number - 1 } : item
      )
    );
  }, []);

  const monsterUpkeep = useCallback(() => {
    setMonsters((prevMonsters) =>
      prevMonsters.map((monster) => {
        const monsterRoom = rooms.find((r, idx) => idx === monster.roomNo);
        if (!monsterRoom) return monster;

        const randomChoice = Math.floor(Math.random() * 4);
        const door = monsterRoom.doors[randomChoice];

        if (door !== 'x') {
          return {
            ...monster,
            roomNo: monsterRoom.doorRoomNos[randomChoice],
          };
        }
        return monster;
      })
    );
  }, [rooms]);

  const roomDescription = useCallback((room: Room) => {
    let description = room.description;

    // Add object descriptions
    if (room.objects && room.objects.length > 0) {
      const objectDescs = room.objects.map((obj: RoomObject, idx: number) => {
        const state = obj.open ? 'open' : 'closed';
        const prefix = idx === 0 ? '\nYou see a' : ' and a';
        return `${prefix} ${obj.object} that is ${state}`;
      });
      description += objectDescs.join('');
    }

    // Add item descriptions
    if (room.items && room.items.length > 0) {
      const itemDescs: string[] = [];
      room.items.forEach((item: RoomItem, idx: number) => {
        if (item.pickedUp === 0) {
          const article =
            item.item === 'AMMO' || item.item === 'MEDS' ? 'some' : 'a';
          const prefix =
            idx === 0 && (!room.objects || room.objects.length === 0)
              ? '\nYou also see'
              : idx === 0
              ? '\nYou also see'
              : ' and';
          itemDescs.push(
            `${prefix} ${article} ${item.item} on a ${item.location}`
          );
        }
      });
      description += itemDescs.join('');
    }

    return description;
  }, []);

  const getMap = useCallback(() => {
    return gameData.map[roomNo];
  }, [roomNo]);

  const getRoomDescription = useCallback(() => {
    return roomDescription(rooms[roomNo]);
  }, [roomNo, rooms, roomDescription]);

  const getInventory = useCallback(() => {
    const kitList = equipment
      .map((item) => `${item.item} ${item.number}`)
      .join(', ');
    return `${kitList}
${ranged.name} 4d10dmg ${ranged.ammo}shots
${close.name} ${close.dmg}d10dmg
`;
  }, [equipment, ranged, close]);

  const getStats = useCallback(() => {
    return `HP:${HP}, STRESS: ${Stress}, ST:${ST}, SP:${SP}, IN:${IN}, CO:${CO}`;
  }, [HP, Stress, ST, SP, IN, CO]);

  const move = useCallback(
    (direction: string) => {
      const dirMap: { [key: string]: number } = {
        n: 0,
        e: 1,
        s: 2,
        w: 3,
      };
      const dirIdx = dirMap[direction];

      // Check if in combat
      const inCombat = monsters.some((m) => m.roomNo === roomNo && m.hp > 0);
      if (inCombat) {
        const monster = monsters.find((m) => m.roomNo === roomNo && m.hp > 0);
        return `You cannot leave, you are in combat with a ${monster?.name}!`;
      }

      const currentRoom = rooms[roomNo];

      if (currentRoom.doors[dirIdx] === 'x') {
        return 'You cannot go this way';
      }

      // Check if door is locked
      if (currentRoom.key[dirIdx] !== 0) {
        const keyName = currentRoom.key[dirIdx];
        const hasKey = equipment.some((item) => item.item === keyName);

        if (hasKey) {
          // Unlock the door
          setRooms((prev) =>
            prev.map((room, idx) =>
              idx === roomNo
                ? {
                    ...room,
                    key: room.key.map((k: string | number, i: number) =>
                      i === dirIdx ? 0 : k
                    ),
                  }
                : room
            )
          );
          const newRoomNo = currentRoom.doorRoomNos[dirIdx];
          setRoomNo(newRoomNo);
          upkeep();

          // Check for monsters in new room
          const monsterInRoom = monsters.find(
            (m) => m.roomNo === newRoomNo && m.hp > 0
          );
          if (monsterInRoom) {
            setCombat(1);
            return `${roomDescription(rooms[newRoomNo])}\n\nThere is a ${
              monsterInRoom.name
            } in the room with you!`;
          } else {
            monsterUpkeep();
            return roomDescription(rooms[newRoomNo]);
          }
        } else {
          return `This door appears to be locked. You can see the door has ${keyName} on a plate`;
        }
      }

      // Move to new room
      const newRoomNo = currentRoom.doorRoomNos[dirIdx];
      setRoomNo(newRoomNo);
      upkeep();

      // Check for monsters in new room
      const monsterInRoom = monsters.find(
        (m) => m.roomNo === newRoomNo && m.hp > 0
      );
      if (monsterInRoom) {
        setCombat(1);
        return `${roomDescription(rooms[newRoomNo])}\n\nThere is a ${
          monsterInRoom.name
        } in the room with you!`;
      } else {
        monsterUpkeep();
        return roomDescription(rooms[newRoomNo]);
      }
    },
    [roomNo, rooms, monsters, equipment, upkeep, monsterUpkeep, roomDescription]
  );

  const shoot = useCallback(() => {
    if (ranged.ammo <= 0) {
      const monster = monsters.find((m) => m.roomNo === roomNo && m.hp > 0);
      if (monster) {
        const monsterDmg = Xd10(monster.dmg);
        setHP((prev) => prev - monsterDmg);
        const newHP = HP - monsterDmg;
        const result = `You pull the trigger of your ${ranged.name} but it just clicks. You are out of ammo!\n\nThe monster hits you for ${monsterDmg}dmg! (${newHP})`;

        if (newHP <= 0) {
          return result + '\n\nYou have died...';
        }
        return result;
      }
      return `You pull the trigger of your ${ranged.name} but it just clicks. You are out of ammo!`;
    }

    const monster = monsters.find((m) => m.roomNo === roomNo && m.hp > 0);
    if (!monster) {
      return 'There is no monster to shoot!';
    }

    let result = '';
    const speedCheck = d100();

    if (speedCheck < SP) {
      // Player goes first
      result += `Speed check: ${speedCheck} - SUCCESS! You go first!\n`;

      const combatCheck = d100();
      if (combatCheck < CO) {
        const rangedDmg = Xd10(ranged.dmg);
        setMonsters((prev) =>
          prev.map((m) =>
            m.roomNo === roomNo && m.hp > 0 ? { ...m, hp: m.hp - rangedDmg } : m
          )
        );
        setRanged((prev) => ({ ...prev, ammo: prev.ammo - 1 }));
        result += `Combat Check:${combatCheck}    SUCCESS! You shoot the ${monster.name} for ${rangedDmg}dmg with your ${ranged.name}! BANG!\n`;

        const newMonsterHP = monster.hp - rangedDmg;
        if (newMonsterHP > 0) {
          // Monster attacks back
          const monsterCombatCheck = Math.floor(Math.random() * 100);
          if (monsterCombatCheck < monster.combat) {
            const monsterDmg = Xd10(monster.dmg);
            setHP((prev) => prev - monsterDmg);
            result += `\nThe ${
              monster.name
            } hits you back for ${monsterDmg}dmg! (${HP - monsterDmg})`;
            if (HP - monsterDmg <= 0) {
              result += '\n\nYou have died...';
            }
          } else {
            result += `The ${monster.name} misses you`;
          }

          // Monster status
          if (newMonsterHP < monster.maxhp / 4) {
            result += `\n\nThe ${monster.name} is still alive but looks quite seriously wounded`;
          } else if (newMonsterHP < monster.maxhp / 2) {
            result += `\n\nThe ${monster.name} is still alive but looks quite badly wounded`;
          } else {
            result += `\n\nThe ${monster.name} is still alive and looks relatively healthy`;
          }
        } else {
          result += `\nYou have killed the ${monster.name}`;
          setCombat(0);
        }
      } else {
        setRanged((prev) => ({ ...prev, ammo: prev.ammo - 1 }));
        result += `Combat Check:${combatCheck}    FAILURE! You miss the ${monster.name} and the shot hits the wall! KADUMP!`;
      }
    } else {
      // Monster goes first
      result += `Speed check: ${speedCheck} - FAILURE! The ${monster.name} goes first!\n`;

      const monsterCombatCheck = Math.floor(Math.random() * 100);
      if (monsterCombatCheck < monster.combat) {
        const monsterDmg = Xd10(monster.dmg);
        setHP((prev) => prev - monsterDmg);
        result += `\nThe ${monster.name} hits you for ${monsterDmg}dmg! (${
          HP - monsterDmg
        })`;
        if (HP - monsterDmg <= 0) {
          result += '\n\nYou have died...';
          return result;
        }
      } else {
        result += `The ${monster.name} misses you\n`;
      }

      // Player attacks
      const combatCheck = d100();
      if (combatCheck < CO) {
        const rangedDmg = Xd10(ranged.dmg);
        setMonsters((prev) =>
          prev.map((m) =>
            m.roomNo === roomNo && m.hp > 0 ? { ...m, hp: m.hp - rangedDmg } : m
          )
        );
        setRanged((prev) => ({ ...prev, ammo: prev.ammo - 1 }));
        result += `\nCombat Check:${combatCheck}    SUCCESS! You shoot the ${monster.name} for ${rangedDmg}dmg with your ${ranged.name}! BANG!`;

        if (monster.hp - rangedDmg <= 0) {
          result += `\n\nYou have killed the ${monster.name}`;
          setCombat(0);
        }
      } else {
        setRanged((prev) => ({ ...prev, ammo: prev.ammo - 1 }));
        result += `\nCombat Check:${combatCheck}    FAILURE! You miss the ${monster.name} and the shot hits the wall! KADUMP!`;
      }
    }

    upkeep();
    return result;
  }, [ranged, monsters, roomNo, HP, SP, CO, d100, Xd10, upkeep]);

  const hit = useCallback(() => {
    const monster = monsters.find((m) => m.roomNo === roomNo && m.hp > 0);
    if (!monster) {
      return 'There is no monster to hit!';
    }

    let result = '';
    const speedCheck = d100();

    if (speedCheck < SP) {
      result += `Speed check: ${speedCheck} - SUCCESS! You go first!\n`;

      const combatCheck = d100();
      if (combatCheck < CO) {
        const closeDmg = Xd10(close.dmg);
        setMonsters((prev) =>
          prev.map((m) =>
            m.roomNo === roomNo && m.hp > 0 ? { ...m, hp: m.hp - closeDmg } : m
          )
        );
        result += `Combat Check:${combatCheck}    SUCCESS! You hit the ${monster.name} for ${closeDmg}dmg with your ${close.name}! THWACK!\n`;

        const newMonsterHP = monster.hp - closeDmg;
        if (newMonsterHP > 0) {
          const monsterCombatCheck = Math.floor(Math.random() * 100);
          if (monsterCombatCheck < monster.combat) {
            const monsterDmg = Xd10(monster.dmg);
            setHP((prev) => prev - monsterDmg);
            result += `\nThe ${
              monster.name
            } hits you back for ${monsterDmg}dmg! (${HP - monsterDmg})`;
            if (HP - monsterDmg <= 0) {
              result += '\n\nYou have died...';
            }
          } else {
            result += `The ${monster.name} misses you`;
          }
        } else {
          result += `\nYou have killed the ${monster.name}`;
          setCombat(0);
        }
      } else {
        result += `Combat Check:${combatCheck}    FAILURE! You miss the ${monster.name} and the swing goes wide! SWOOSH!`;
      }
    } else {
      result += `Speed check: ${speedCheck} - FAILURE! The ${monster.name} goes first!\n`;

      const monsterCombatCheck = Math.floor(Math.random() * 100);
      if (monsterCombatCheck < monster.combat) {
        const monsterDmg = Xd10(monster.dmg);
        setHP((prev) => prev - monsterDmg);
        result += `\nThe ${monster.name} hits you for ${monsterDmg}dmg! (${
          HP - monsterDmg
        })`;
        if (HP - monsterDmg <= 0) {
          result += '\n\nYou have died...';
          return result;
        }
      } else {
        result += `The ${monster.name} misses you\n`;
      }

      const combatCheck = d100();
      if (combatCheck < CO) {
        const closeDmg = Xd10(close.dmg);
        setMonsters((prev) =>
          prev.map((m) =>
            m.roomNo === roomNo && m.hp > 0 ? { ...m, hp: m.hp - closeDmg } : m
          )
        );
        result += `\nCombat Check:${combatCheck}    SUCCESS! You hit the ${monster.name} for ${closeDmg}dmg with your ${close.name}! THWACK!`;

        if (monster.hp - closeDmg <= 0) {
          result += `\n\nYou have killed the ${monster.name}`;
          setCombat(0);
        }
      } else {
        result += `\nCombat Check:${combatCheck}    FAILURE! You miss the ${monster.name} and the swing goes wide! SWOOSH!`;
      }
    }

    upkeep();
    return result;
  }, [monsters, roomNo, HP, SP, CO, close, d100, Xd10, upkeep]);

  const pickup = useCallback(
    (item: string) => {
      const room = rooms[roomNo];
      const roomItem = room.items?.find(
        (i: RoomItem) => i.item === item && i.pickedUp === 0
      );

      if (!roomItem) {
        return 'That item is not in the room\n\nMake sure you have use CAPITALS to spell the Item you want to pickup';
      }

      if (item === 'AMMO') {
        setRanged((prev) => ({ ...prev, ammo: prev.ammo + 6 }));
        setRooms((prev) =>
          prev.map((r, idx) =>
            idx === roomNo
              ? {
                  ...r,
                  items: r.items?.map((i: RoomItem) =>
                    i.item === item ? { ...i, pickedUp: 1 } : i
                  ),
                }
              : r
          )
        );
        upkeep();
        monsterUpkeep();
        return 'You pick up 6 ammo';
      }

      const equipmentItem = equipment.find((e) => e.item === item);
      if (equipmentItem) {
        setEquipment((prev) =>
          prev.map((e) =>
            e.item === item ? { ...e, number: e.number + 1 } : e
          )
        );
        setRooms((prev) =>
          prev.map((r, idx) =>
            idx === roomNo
              ? {
                  ...r,
                  items: r.items?.map((i: RoomItem) =>
                    i.item === item ? { ...i, pickedUp: 1 } : i
                  ),
                }
              : r
          )
        );
        upkeep();
        monsterUpkeep();
        return `You pick up the ${item}`;
      }

      // Check if it's a key
      const isKey = rooms.some((r) => r.key.includes(item));
      if (isKey) {
        setEquipment((prev) => [...prev, { item, number: 1 }]);
        setRooms((prev) =>
          prev.map((r, idx) =>
            idx === roomNo
              ? {
                  ...r,
                  items: r.items?.map((i: RoomItem) =>
                    i.item === item ? { ...i, pickedUp: 1 } : i
                  ),
                }
              : r
          )
        );
        upkeep();
        monsterUpkeep();
        return `You pick up the ${item}`;
      }

      return 'That item is not in the room';
    },
    [roomNo, rooms, equipment, upkeep, monsterUpkeep]
  );

  const tryOpen = useCallback(
    (object: string) => {
      const room = rooms[roomNo];
      const obj = room.objects?.find((o: RoomObject) => o.object === object);

      if (!obj) {
        return {
          needsStrengthCheck: false,
          message:
            'That is not in the room\n\nMake sure you have use CAPITALS to spell the Object you want to open',
        };
      }

      if (obj.open === 1) {
        return {
          needsStrengthCheck: false,
          message: `You have already searched the ${object}`,
        };
      }

      if (obj.check === 'ST') {
        return {
          needsStrengthCheck: true,
          message: '',
        };
      }

      // Open without strength check
      return {
        needsStrengthCheck: false,
        message: '',
        autoOpen: true,
      };
    },
    [roomNo, rooms]
  );

  const openWithStrengthCheck = useCallback(
    (object: string, response: string) => {
      const room = rooms[roomNo];
      const objIndex = room.objects?.findIndex(
        (o: RoomObject) => o.object === object
      );

      if (objIndex === undefined || objIndex === -1) {
        return 'Object not found';
      }

      const obj = room.objects![objIndex];

      if (response === 'N') {
        upkeep();
        monsterUpkeep();
        return 'You choose to save your energy';
      }

      if (response !== 'Y') {
        return 'That is not a valid option. Please type Y or N';
      }

      const diceRoll = Math.floor(Math.random() * 100);
      let item = obj.item;

      // Generate random item if needed
      if (item === 'random') {
        const random = Math.floor(Math.random() * 6) + 1;
        const itemMap: { [key: number]: string } = {
          1: 'NOTHING',
          2: 'AMMO',
          3: 'STIMPACK',
          4: 'MEDS',
          5: 'SHOTGUN',
          6: 'BOARDING AXE',
        };
        item = itemMap[random];
      }

      if (diceRoll < ST) {
        // Success
        setRooms((prev) =>
          prev.map((r, idx) =>
            idx === roomNo
              ? {
                  ...r,
                  objects: r.objects?.map((o: RoomObject, i: number) =>
                    i === objIndex ? { ...o, open: 1, pickedUp: 1 } : o
                  ),
                }
              : r
          )
        );

        const article =
          item === 'NOTHING'
            ? ''
            : item === 'AMMO' || item === 'MEDS'
            ? 'some'
            : 'a';
        const foundText =
          item === 'NOTHING'
            ? 'But you find nothing inside. Unlucky!'
            : `You find inside ${article} ${item}!`;

        upkeep();
        monsterUpkeep();
        return `Strength check: ${diceRoll} SUCCESS! ${foundText}`;
      } else {
        // Failure
        setStress((prev) => prev + 1);
        upkeep();
        monsterUpkeep();
        return `Strength check: ${diceRoll} FAILURE! You gain 1 STRESS!\n\nYou just cannot seem to get the ${object} open!`;
      }
    },
    [roomNo, rooms, ST, upkeep, monsterUpkeep]
  );

  const listen = useCallback(() => {
    let listenString = '';

    monsters.forEach((monster) => {
      // North
      const listenCheckN = Math.floor(Math.random() * 100);
      if (listenCheckN < IN) {
        listenString +=
          monster.roomNo === rooms[roomNo].doorRoomNos[0] ? 'N' : 'n';
      } else {
        listenString += 'n';
      }

      // East
      const listenCheckE = Math.floor(Math.random() * 100);
      if (listenCheckE < IN) {
        listenString +=
          monster.roomNo === rooms[roomNo].doorRoomNos[1] ? 'E' : 'e';
      } else {
        listenString += 'e';
      }

      // South
      const listenCheckS = Math.floor(Math.random() * 100);
      if (listenCheckS < IN) {
        listenString +=
          monster.roomNo === rooms[roomNo].doorRoomNos[2] ? 'S' : 's';
      } else {
        listenString += 's';
      }

      // West
      const listenCheckW = Math.floor(Math.random() * 100);
      if (listenCheckW < IN) {
        listenString +=
          monster.roomNo === rooms[roomNo].doorRoomNos[3] ? 'W' : 'w';
      } else {
        listenString += 'w';
      }

      // Here
      const listenCheckH = Math.floor(Math.random() * 100);
      if (listenCheckH < IN) {
        listenString += monster.roomNo === roomNo ? 'H' : 'h';
      } else {
        listenString += 'h';
      }
    });

    upkeep();
    monsterUpkeep();
    return listenString;
  }, [roomNo, rooms, monsters, IN, upkeep, monsterUpkeep]);

  const scan = useCallback(() => {
    const bioscannerItem = equipment.find((e) => e.item === 'Bioscanner');

    if (!bioscannerItem || bioscannerItem.number === -1) {
      return 'You do not currently have a Bioscanner';
    }

    if (bioscannerItem.number === 0) {
      return 'Your Bioscanner is out of energy and is not currently working!';
    }

    let scanString = '';
    monsters.forEach((monster) => {
      scanString += monster.roomNo === rooms[roomNo].doorRoomNos[0] ? 'N' : 'n';
      scanString += monster.roomNo === rooms[roomNo].doorRoomNos[1] ? 'E' : 'e';
      scanString += monster.roomNo === rooms[roomNo].doorRoomNos[2] ? 'S' : 's';
      scanString += monster.roomNo === rooms[roomNo].doorRoomNos[3] ? 'W' : 'w';
      scanString += monster.roomNo === roomNo ? 'H' : 'h';
    });

    setEquipment((prev) =>
      prev.map((item) =>
        item.item === 'Bioscanner' ? { ...item, number: item.number - 1 } : item
      )
    );

    const newBioscannerNumber = bioscannerItem.number - 1;
    upkeep();
    monsterUpkeep();

    if (newBioscannerNumber === 0) {
      return `${scanString}\n\nYour Bioscanner has just died!`;
    }

    return scanString;
  }, [roomNo, rooms, monsters, equipment, upkeep, monsterUpkeep]);

  const useStimpack = useCallback(() => {
    const stimpackItem = equipment.find((e) => e.item === 'STIMPACK');
    if (!stimpackItem || stimpackItem.number <= 0) {
      return 'You do not have any stimpacks!';
    }

    const healing = Math.floor(Math.random() * 10) + 1;
    setHP((prev) => prev + healing);
    setAdvantage(5);
    setEquipment((prev) =>
      prev.map((item) =>
        item.item === 'STIMPACK' ? { ...item, number: item.number - 1 } : item
      )
    );

    return `You heal for ${healing}hp and get [+] on the next 5 dice rolls`;
  }, [equipment]);

  const useMeds = useCallback(() => {
    const medsItem = equipment.find((e) => e.item === 'MEDS');
    if (!medsItem || medsItem.number <= 0) {
      return 'You do not have any MEDS';
    }

    setStress((prev) => Math.max(0, prev - 10));
    setEquipment((prev) =>
      prev.map((item) =>
        item.item === 'MEDS' ? { ...item, number: item.number - 1 } : item
      )
    );

    return 'You have reduced your stress by 10';
  }, [equipment]);

  return {
    getMap,
    getRoomDescription,
    getInventory,
    getStats,
    move,
    shoot,
    hit,
    pickup,
    tryOpen,
    openWithStrengthCheck,
    listen,
    scan,
    useStimpack,
    useMeds,
  };
}
