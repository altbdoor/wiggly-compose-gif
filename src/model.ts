import type { QueueEntry } from "../v1/src/model";

export interface QueueEntry2 extends QueueEntry {
  duration: number;
  speed: number;
}
