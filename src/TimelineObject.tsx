// oxlint-disable react/refs
// see https://github.com/floating-ui/floating-ui/discussions/3405#discussioncomment-14657647

import {
  arrow,
  autoUpdate,
  FloatingArrow,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  useFloating,
  useHover,
  useInteractions,
} from "@floating-ui/react";
import { useRef, useState } from "react";
import { DURATION_MAX, DURATION_MIN, SPEED_MAX, SPEED_MIN } from "./constants";
import type { QueueEntry2 } from "./model";
import { useQueueStore } from "./util/queue-store";

interface TimelineObjectProps extends Pick<
  QueueEntry2,
  "id" | "previewUrl" | "speed" | "duration"
> {
  size: number;
  isDragging: boolean;
}

export function TimelineObject({
  id,
  previewUrl,
  speed,
  duration,
  size,
  isDragging,
}: TimelineObjectProps) {
  const updateQueue = useQueueStore((state) => state.updateQueue);
  const copyQueue = useQueueStore((state) => state.copyQueue);
  const removeQueue = useQueueStore((state) => state.removeQueue);

  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);

  const updateField = (key: "duration" | "speed", value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return;
    }

    updateQueue({ id, [key]: Number(trimmedValue) });
  };

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "top-start",
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), shift({ padding: 8 }), arrow({ element: arrowRef })],
  });

  const hover = useHover(context, {
    handleClose: safePolygon(),
    delay: { open: 0, close: 200 },
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <>
      <div
        className="timeline__item-object"
        style={{ width: duration * size }}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <img src={previewUrl || `${import.meta.env.BASE_URL}blank.png`} alt={id} />
      </div>

      {isOpen && !isDragging && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, zIndex: 50 }}
            {...getFloatingProps()}
          >
            <div className="timeline__item-form">
              <div className="small">Speed</div>
              <input
                className="form-range"
                name="speed"
                type="range"
                min={SPEED_MIN}
                max={SPEED_MAX}
                defaultValue={speed}
                onChange={(evt) => updateField("speed", evt.currentTarget.value)}
              />

              <div className="small">Duration</div>
              <div className="input-group input-group-sm was-validated">
                <input
                  className="form-control text-center"
                  name="duration"
                  type="number"
                  min={DURATION_MIN}
                  max={DURATION_MAX}
                  step="any"
                  defaultValue={duration}
                  onChange={(evt) => updateField("duration", evt.currentTarget.value)}
                />
                <span className="input-group-text">s</span>
              </div>
              <div className="timeline__item-form-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-info w-100"
                  onClick={() => copyQueue(id)}
                >
                  Copy
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => removeQueue(id)}
                >
                  &times;
                </button>
              </div>
            </div>
            <FloatingArrow ref={arrowRef} context={context} fill="var(--bs-secondary)" />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
