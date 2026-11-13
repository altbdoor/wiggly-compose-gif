import { useEffect, useRef, useState } from "react";
import { useQueueStore } from "./util/queue-store";
import { useVideoStore } from "./util/video-store";
import { encodeVideo } from "./util/encode-video";
import { create, revoke } from "./util/blob-url-manager";

const FACTORS = [0.5, 1, 2, 3, 4];
const ROTATIONS = [0, 90, 180, 270];

export function Preview() {
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined);
  const [rotate, setRotate] = useState(0);
  const [factor, setFactor] = useState(3);
  const [useFfmpeg, setUseFfmpeg] = useState<"yes" | "no">("no");

  const [isProcessing, setIsProcessing] = useState(false);
  const [processTime, setProcessTime] = useState(0);
  const [metadata, setMetadata] = useState({ duration: 0, width: 0, height: 0, size: "0" });

  const queue = useQueueStore((state) => state.queue);
  const setCurrentTime = useVideoStore((state) => state.setCurrentTime);
  const isPlaying = useVideoStore((state) => state.isPlaying);
  const setIsPlaying = useVideoStore((state) => state.setIsPlaying);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    let loopId = -1;
    loopId = setInterval(() => {
      const videoElem = videoRef.current;
      if (!videoElem) {
        return;
      }

      setCurrentTime(videoElem.currentTime);
    }, 100);

    return () => clearInterval(loopId);
  }, [setCurrentTime, isPlaying]);

  useEffect(() => {
    if (queue.length === 0) {
      return;
    }

    let cancelled = false;
    const delayEncodeId = setTimeout(async () => {
      const startTime = Date.now();
      setIsProcessing(true);

      const blob = await encodeVideo(queue, factor, useFfmpeg === "yes", rotate);
      if (cancelled) {
        return;
      }

      const blobUrl = create(blob);

      setVideoSrc((prev) => {
        if (prev) {
          revoke(prev);
        }

        return blobUrl;
      });
      setIsProcessing(false);
      setProcessTime((Date.now() - startTime) / 1000);
      setMetadata((prev) => ({ ...prev, size: (blob.size / 1024 / 1024).toFixed(2) }));
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(delayEncodeId);
    };
  }, [queue, rotate, factor, useFfmpeg]);

  return (
    <div className="preview">
      <div className="preview__controls">
        <div className="input-group input-group-sm">
          <span className="input-group-text">Rotation</span>
          <select
            className="form-control"
            value={rotate}
            onChange={(evt) => setRotate(Number(evt.currentTarget.value))}
          >
            {ROTATIONS.map((item) => (
              <option key={item} value={item}>
                {item}deg
              </option>
            ))}
          </select>
        </div>
        <div className="input-group input-group-sm">
          <span className="input-group-text">Render size</span>
          <select
            className="form-control"
            value={factor}
            onChange={(evt) => setFactor(Number(evt.currentTarget.value))}
          >
            {FACTORS.map((item) => (
              <option key={item} value={item}>
                {item}x
              </option>
            ))}
          </select>
        </div>
        <div className="input-group input-group-sm">
          <span className="input-group-text">Use Ffmpeg</span>
          <select
            className="form-control"
            value={useFfmpeg}
            onChange={(evt) => setUseFfmpeg(evt.currentTarget.value as "yes")}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <a href={videoSrc} download="compiled.mp4" className="btn btn-info btn-sm">
          Download
        </a>
      </div>
      <div className="preview__video">
        <video
          ref={videoRef}
          loop
          muted
          controls
          playsInline
          disablePictureInPicture
          controlsList="nofullscreen noremoteplayback"
          src={videoSrc}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(evt) => {
            if (!isPlaying) {
              setCurrentTime(evt.currentTarget.currentTime);
            }
          }}
          onLoadedData={(evt) => {
            const { videoWidth, videoHeight, duration } = evt.currentTarget;
            setMetadata((prev) => ({
              ...prev,
              width: videoWidth,
              height: videoHeight,
              duration,
            }));
          }}
        ></video>
      </div>
      <div className="preview__status">
        <span className="badge text-bg-primary">
          {metadata.width}&times;{metadata.height}px
        </span>
        <span className="badge text-bg-primary">{metadata.duration}s</span>
        <span className="badge text-bg-primary">{metadata.size}MB</span>
        <span className="badge text-bg-secondary">{processTime.toFixed(2)}s</span>
        <span className="badge text-bg-secondary">{isProcessing ? "Processing..." : "Ready"}</span>
      </div>
    </div>
  );
}
