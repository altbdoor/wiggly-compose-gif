import { type ChangeEventHandler } from "react";
import { DURATION_MAX, DURATION_MIN, SPEED_MAX, SPEED_MIN } from "./constants";
import { decodeImage } from "./util/decode-image";
import { useQueueStore } from "./util/queue-store";

export function Controls() {
  const setQueue = useQueueStore((state) => state.setQueue);
  const appendQueue = useQueueStore((state) => state.appendQueue);
  const updateQueue = useQueueStore((state) => state.updateQueue);
  const reverseQueue = useQueueStore((state) => state.reverseQueue);

  const handleChange: ChangeEventHandler<HTMLInputElement> = async (evt) => {
    const files = Array.from(evt.currentTarget.files ?? []);
    if (!files || files.length === 0) {
      return;
    }

    const newEntries: Parameters<typeof appendQueue>[0] = [];
    for (const file of files) {
      const entry = await decodeImage(file);
      newEntries.push(entry);
    }

    appendQueue(newEntries);
  };

  const updateAllQueue = (key: "duration" | "speed", elem: HTMLElement) => {
    const val = elem.closest('[role="form"]')!.querySelector("input")!.value;
    const valTrim = val.trim();
    if (!valTrim) {
      return;
    }

    updateQueue({ [key]: Number(valTrim) });
  };

  return (
    <div className="controls">
      <label className="btn btn-primary">
        Import <span className="d-none d-md-inline">images</span>
        <input
          type="file"
          accept="image/gif,image/jpeg,image/png,image/webp"
          multiple
          onChange={handleChange}
          className="d-none"
        />
      </label>

      <button type="button" className="btn btn-secondary" onClick={reverseQueue}>
        Reverse
      </button>

      <button type="button" className="btn btn-secondary" onClick={() => setQueue([])}>
        Clear
      </button>

      <div className="controls__item" role="form">
        <div className="d-flex justify-content-between align-items-center">
          <small>Set all speed</small>
          <button
            type="button"
            className="btn btn-info btn-sm py-0"
            onClick={(evt) => updateAllQueue("speed", evt.currentTarget)}
          >
            Set
          </button>
        </div>
        <input
          type="range"
          name="speed-base"
          className="form-range"
          min={SPEED_MIN}
          max={SPEED_MAX}
          defaultValue={0}
        />
      </div>

      <div className="controls__item" role="form">
        <div className="d-flex justify-content-between align-items-center pb-1">
          <small>Set all duration</small>
          <button
            type="button"
            className="btn btn-info btn-sm py-0"
            onClick={(evt) => updateAllQueue("duration", evt.currentTarget)}
          >
            Set
          </button>
        </div>
        <div className="input-group input-group-sm was-validated">
          <input
            className="form-control text-center"
            name="duration-base"
            type="number"
            min={DURATION_MIN}
            max={DURATION_MAX}
            step="any"
            defaultValue={1}
          />
          <span className="input-group-text">s</span>
        </div>
      </div>

      <div className="controls__extra">
        <a className="btn btn-secondary btn-sm" href="./help.html">
          Help
        </a>
        <a className="btn btn-secondary btn-sm" href="./v1/">
          Use V1
        </a>
      </div>
    </div>
  );
}
