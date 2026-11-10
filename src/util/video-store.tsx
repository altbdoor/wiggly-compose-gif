import { create } from "zustand";

type VideoStore = {
  currentTime: number;
  isPlaying: boolean;
  setCurrentTime: (currentTime: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
};

export const useVideoStore = create<VideoStore>((set) => ({
  currentTime: 0,
  isPlaying: false,

  setCurrentTime: (currentTime) => set((state) => ({ ...state, currentTime })),
  setIsPlaying: (isPlaying) => set((state) => ({ ...state, isPlaying })),
}));
