import { useEffect, useRef, useState, type ChangeEventHandler } from "react";
import type { ComposeOptions, QueueEntry } from "./model";
import { Preview } from "./Preview";
import { QueueList } from "./QueueList";
import { decodeGif } from "./utils/decode-gif";
import { encodeVideo } from "./utils/encode-video";

export function App() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const previewUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      previewUrls.current.forEach(URL.revokeObjectURL);
    };
  }, []);

  const handleChange: ChangeEventHandler<HTMLInputElement> = async (evt) => {
    const files = Array.from(evt.currentTarget.files ?? []);
    if (!files || files.length === 0) {
      return;
    }

    const canvas = new OffscreenCanvas(1, 1);
    const newEntries: typeof queue = [];

    for (const file of files) {
      const entry = await decodeGif(file, canvas);
      previewUrls.current.push(entry.previewUrl);
      newEntries.push(entry);
    }

    setQueue((prev) => [...prev, ...newEntries]);
  };

  const removeFromQueue = (removeId: string, previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
    previewUrls.current = previewUrls.current.filter(
      (url) => url !== previewUrl,
    );
    setQueue((prev) => prev.filter((item) => item.id !== removeId));
  };

  const clearQueue = () => {
    previewUrls.current.forEach(URL.revokeObjectURL);
    previewUrls.current = [];
    setQueue([]);
  };

  const moveQueue = (from: number, to: number) => {
    if (to < 0 || from === to) {
      return;
    }

    setQueue((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const compose = async (opts: ComposeOptions) => {
    if (queue.length === 0) {
      return;
    }

    const resolved = queue.map((entry, idx) => ({
      ...entry,
      durationInS: opts.durations[idx] ?? 0,
    }));

    const blob = encodeVideo(
      resolved,
      opts.renderSize,
      opts.useFfmpeg,
      opts.rotation,
    );
    return blob;
  };

  return (
    <div className="container-fluid container-lg position-relative">
      <div className="pt-2 d-md-none">
        <div className="alert alert-warning p-1 text-black text-center mb-0">
          <small>
            <i className="bi bi-exclamation-triangle"></i> UI is not optimized
            for mobile/tablet screen sizes.
          </small>
        </div>
      </div>

      <div className="row">
        <div className="col-12 col-md-6 col-lg-5 col-xl-4 py-3 left-block">
          <div className="h-100 bg-secondary text-white p-2 overflow-anchor-none">
            <div className="d-flex align-items-center gap-1 pb-2">
              <h5 className="m-0">
                <i className="bi bi-layers"></i> Queue
              </h5>

              <label className="btn btn-primary btn-sm ms-auto">
                Upload <span className="d-none d-md-inline">GIFs</span>
                <input
                  type="file"
                  accept="image/gif"
                  multiple
                  onChange={handleChange}
                  className="d-none"
                />
              </label>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={clearQueue}
                disabled={queue.length === 0}
              >
                Clear
              </button>
            </div>

            <QueueList
              items={queue}
              remove={removeFromQueue}
              move={moveQueue}
            />
          </div>
        </div>
        <div className="col py-3">
          <div className="d-flex pt-2 justify-content-between align-items-center">
            <h5 className="m-0">
              <i className="bi bi-file-play"></i> Preview
            </h5>

            <a href="./help.html" className="btn btn-info btn-sm">
              Need help?
            </a>
          </div>

          <Preview onCompose={compose} />
        </div>
      </div>
    </div>
  );
}
