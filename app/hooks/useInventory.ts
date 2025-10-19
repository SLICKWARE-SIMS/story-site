"use client";

import { useLocalStorage } from "@uidotdev/usehooks";

export interface Inventory {
  credits: number;
  items: string[];
}

const INVENTORY_STORAGE_KEY = "slickware_inventory";

const DEFAULT_INVENTORY: Inventory = {
  credits: 0,
  items: [],
};

export function useInventory() {
  const [inventory, setInventory] = useLocalStorage<Inventory>(
    INVENTORY_STORAGE_KEY,
    DEFAULT_INVENTORY
  );

  const addCredits = (amount: number) => {
    setInventory((prev) => ({
      ...prev,
      credits: prev.credits + amount,
    }));
  };

  const removeCredits = (amount: number) => {
    setInventory((prev) => ({
      ...prev,
      credits: Math.max(0, prev.credits - amount),
    }));
  };

  const addItem = (item: string) => {
    setInventory((prev) => ({
      ...prev,
      items: [...prev.items, item],
    }));
  };

  const removeItem = (item: string) => {
    setInventory((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i !== item),
    }));
  };

  const hasItem = (item: string): boolean => {
    return inventory.items.includes(item);
  };

  const reset = () => {
    setInventory(DEFAULT_INVENTORY);
  };

  return {
    inventory,
    addCredits,
    removeCredits,
    addItem,
    removeItem,
    hasItem,
    reset,
  };
}
