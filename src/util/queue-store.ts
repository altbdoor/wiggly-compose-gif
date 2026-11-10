import { create } from "zustand";
import type { QueueEntry2 } from "../model";
import { DURATION_MAX, DURATION_MIN, SPEED_MAX, SPEED_MIN } from "../constants";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type QueueStore = {
  queue: QueueEntry2[];
  setQueue: (queue: QueueEntry2[]) => void;
  appendQueue: (entries: QueueEntry2[]) => void;
  moveQueue: (from: number, to: number) => void;
  updateQueue: (entry: Partial<QueueEntry2>) => void;
  copyQueue: (id: string) => void;
  removeQueue: (id: string) => void;
  reverseQueue: () => void;
};

export const useQueueStore = create<QueueStore>((set) => ({
  queue: [],

  setQueue: (queue) => set({ queue }),
  appendQueue: (entries) => set((state) => ({ queue: [...state.queue, ...entries] })),

  moveQueue: (from, to) => {
    if (to < 0 || from === to) {
      return;
    }

    set((state) => {
      const prev = state.queue;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { queue: next };
    });
  },

  updateQueue: (entry) => {
    const { id, ...patch } = entry;

    if (patch.speed !== undefined) {
      patch.speed = clamp(patch.speed, SPEED_MIN, SPEED_MAX);
    }

    if (patch.duration !== undefined) {
      patch.duration = clamp(patch.duration, DURATION_MIN, DURATION_MAX);
    }

    const target = id ?? "all";
    set((state) => ({
      queue: state.queue.map((item) => {
        if (target === "all" || target === item.id) {
          return { ...item, ...patch };
        }

        return item;
      }),
    }));
  },

  copyQueue: (id) => {
    set((state) => ({
      queue: state.queue.flatMap((item) => {
        if (item.id !== id) {
          return [item];
        }

        return [item, { ...item, id: crypto.randomUUID() }];
      }),
    }));
  },

  removeQueue: (id) => {
    set((state) => ({ queue: state.queue.filter((item) => item.id !== id) }));
  },

  reverseQueue: () => {
    set((state) => ({ queue: state.queue.toReversed() }));
  },
}));
