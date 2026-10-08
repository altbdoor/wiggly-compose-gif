import { GifReader } from "omggif";
import type { QueueEntry } from "../model";

export async function decodeImage(file: File, canvas: OffscreenCanvas): Promise<QueueEntry> {
  let width: number;
  let height: number;
  let frames: QueueEntry["frames"];

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
    const ctx = canvas.getContext("2d")!;
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
  const ctx = canvas.getContext("2d")!;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  const imageData = new ImageData(frames[0].data as ImageDataArray, width, height);
  ctx.putImageData(imageData, 0, 0);
  const blob = await canvas.convertToBlob({
    quality: 0.75,
    type: "image/jpeg",
  });
  const previewUrl = URL.createObjectURL(blob);

  return { id, filename, previewUrl, frames, width, height };
}
