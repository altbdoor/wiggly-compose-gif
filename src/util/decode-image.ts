import { GifReader } from "omggif";
import { create } from "./blob-url-manager";
import type { QueueEntry2 } from "../model";

// global canvas for decoding images
const canvas = new OffscreenCanvas(1, 1);
const ctx = canvas.getContext("2d")!;

export async function createPreviewUrl(data: Uint8ClampedArray, width: number, height: number) {
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  ctx.putImageData(new ImageData(data as ImageDataArray, width, height), 0, 0);
  const blob = await canvas.convertToBlob({ quality: 0.75, type: "image/jpeg" });
  return create(blob);
}

export async function decodeImage(file: File): Promise<QueueEntry2> {
  let width = -1;
  let height = -1;
  let frames: QueueEntry2["frames"] = [];

  if (file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif")) {
    const buffer = await file.arrayBuffer();
    const reader = new GifReader(new Uint8Array(buffer));

    width = reader.width;
    height = reader.height;
    const rgba = new Uint8ClampedArray(width * height * 4);

    frames = Array(reader.numFrames())
      .fill(0)
      .map((_, idx) => {
        const frameInfo = reader.frameInfo(idx);
        reader.decodeAndBlitFrameRGBA(idx, rgba);

        return {
          delayInMs: frameInfo.delay * 10,
          data: new Uint8ClampedArray(rgba),
        };
      });
  } else {
    const bitmap = await createImageBitmap(file);
    width = bitmap.width;
    height = bitmap.height;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    frames = [
      {
        delayInMs: -1,
        data: ctx.getImageData(0, 0, width, height).data,
      },
    ];
  }

  const id = crypto.randomUUID();
  const filename = file.name;

  // generate preview image
  const previewUrl = await createPreviewUrl(frames[0].data, width, height);

  return { id, filename, previewUrl, frames, width, height, duration: 1, speed: 0 };
}
