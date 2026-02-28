import { create } from 'zustand';
import { List, ListItem } from '../services/api';

interface ListEntry extends List {
  items: ListItem[];
}

interface ListStore {
  lists: ListEntry[];
  addList: (list: List) => void;
  setListItems: (listId: string, items: ListItem[]) => void;
  removeList: (listId: string) => void;

  // Item mutations — called both from local actions and incoming WebSocket events
  applyItemAdded: (listId: string, item: ListItem) => void;
  applyItemChecked: (listId: string, item: ListItem) => void;
  applyItemDeleted: (listId: string, itemId: string) => void;
  applyItemReordered: (listId: string, updates: { id: string; position: number }[]) => void;
}

export const useListStore = create<ListStore>((set) => ({
  lists: [],

  addList: (list) =>
    set((state) => {
      if (state.lists.find((l) => l.id === list.id)) return state;
      return { lists: [...state.lists, { ...list, items: [] }] };
    }),

  setListItems: (listId, items) =>
    set((state) => ({
      lists: state.lists.map((l) => (l.id === listId ? { ...l, items } : l)),
    })),

  removeList: (listId) =>
    set((state) => ({ lists: state.lists.filter((l) => l.id !== listId) })),

  applyItemAdded: (listId, item) =>
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, items: [...l.items, item] } : l,
      ),
    })),

  applyItemChecked: (listId, updated) =>
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId
          ? { ...l, items: l.items.map((i) => (i.id === updated.id ? updated : i)) }
          : l,
      ),
    })),

  applyItemDeleted: (listId, itemId) =>
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, items: l.items.filter((i) => i.id !== itemId) } : l,
      ),
    })),

  applyItemReordered: (listId, updates) =>
    set((state) => ({
      lists: state.lists.map((l) => {
        if (l.id !== listId) return l;
        const posMap = new Map(updates.map(({ id, position }) => [id, position]));
        const reordered = l.items
          .map((i) => ({ ...i, position: posMap.get(i.id) ?? i.position }))
          .sort((a, b) => a.position - b.position);
        return { ...l, items: reordered };
      }),
    })),
}));
