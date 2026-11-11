import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import { DURATION_MAX, DURATION_MIN, SPEED_MAX, SPEED_MIN } from "../constants";
import type { QueueEntry2 } from "../model";
import { createPreviewUrl } from "./decode-image";
import { idbDel, idbGet, idbSet } from "./indexed-db-store";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

interface PersistedQueue {
  queue: QueueEntry2[];
}

const idbStorage: PersistStorage<PersistedQueue> = {
  getItem: async (name) => {
    const state = await idbGet<PersistedQueue>(name);

    if (!state) {
      return null;
    }

    return { state, version: 0 };
  },
  setItem: (name, value) => idbSet(name, value.state),
  removeItem: (name) => idbDel(name),
};

interface QueueStore extends PersistedQueue {
  setQueue: (queue: QueueEntry2[]) => void;
  appendQueue: (entries: QueueEntry2[]) => void;
  moveQueue: (from: number, to: number) => void;
  updateQueue: (entry: Partial<QueueEntry2>) => void;
  copyQueue: (id: string) => void;
  removeQueue: (id: string) => void;
  reverseQueue: () => void;
}

export const useQueueStore = create<QueueStore>()(
  persist(
    (set) => ({
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
    }),
    {
      name: "queue",
      storage: idbStorage,
      partialize: (state): PersistedQueue => ({
        queue: state.queue.map((item) => ({ ...item, previewUrl: "" })),
      }),
      onRehydrateStorage: (storeRef) => (state, error) => {
        if (!state || error || state.queue.length === 0) {
          return;
        }

        Promise.all(
          state.queue.map(async (entry) => {
            if (entry.frames.length === 0) {
              return entry;
            }

            // blob object urls are invalid after reload; regenerate from frame data
            const previewUrl = await createPreviewUrl(
              entry.frames[0].data,
              entry.width,
              entry.height,
            );
            return { ...entry, previewUrl };
          }),
        ).then((queue) => storeRef.setQueue(queue));
      },
    },
  ),
);
