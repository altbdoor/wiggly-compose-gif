import { useEffect, useRef } from "react";
import { useVideoStore } from "./util/video-store";

interface TimelineDialProps {
  size: number;
}

export function TimelineDial({ size }: TimelineDialProps) {
  const currentTime = useVideoStore((state) => state.currentTime);
  const dialRef = useRef<HTMLDivElement>(null);

  const dialFromLeftPx = currentTime * size;
  useEffect(() => {
    const dialElem = dialRef.current;
    if (!dialElem) {
      return;
    }

    const parentElem = dialElem.closest(".timeline");
    if (!parentElem) {
      return;
    }

    const parentLeft = parentElem.scrollLeft;
    const parentWidth = parentElem.clientWidth;

    if (dialFromLeftPx < parentLeft) {
      // dial is behind
      parentElem.scrollTo({ left: dialFromLeftPx });
    } else if (dialFromLeftPx > parentLeft + parentWidth) {
      // dial is ahead
      parentElem.scrollTo({ left: dialFromLeftPx - 100 });
    }
  }, [dialFromLeftPx, size]);

  return (
    <div
      className="timeline__dial"
      ref={dialRef}
      style={{ transform: `translateX(${dialFromLeftPx}px)` }}
    >
      <div></div>
    </div>
  );
}
