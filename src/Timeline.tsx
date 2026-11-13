import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { useEffect, useMemo, useRef, type WheelEventHandler } from "react";
import { TimelineDial } from "./TimelineDial";
import { TimelineObject } from "./TimelineObject";
import { useQueueStore } from "./util/queue-store";

export function Timeline() {
  const queue = useQueueStore((state) => state.queue);
  const moveQueue = useQueueStore((state) => state.moveQueue);

  const size = 240;
  const timelineRef = useRef<HTMLDivElement>(null);

  const timeSpans = useMemo(() => {
    const totalDuration = queue.reduce((acc, val) => acc + val.duration, 0);
    const adjustedDuration = Math.max(Math.ceil(totalDuration + 2), 21);

    return Array.from({ length: adjustedDuration }, (_, idx) => (
      <span key={idx}>{String(idx).padStart(2, "0")}</span>
    ));
  }, [queue]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    if (result.destination.index === result.source.index) {
      return;
    }
    moveQueue(result.source.index, result.destination.index);
  };

  const translateScroll: WheelEventHandler<HTMLDivElement> = (evt) => {
    if (evt.shiftKey || evt.ctrlKey) {
      return;
    }

    if (evt.deltaY !== 0) {
      // evt.preventDefault();
      const parent = evt.currentTarget.closest(".timeline");
      if (parent) {
        parent.scrollLeft += evt.deltaY;
      }
    }
  };

  useEffect(() => {
    if (!timelineRef.current) {
      return;
    }

    timelineRef.current.style.setProperty("--second-width", `${size}px`);
  }, [size]);

  return (
    <div className="timeline" ref={timelineRef} onWheel={translateScroll}>
      <TimelineDial size={size} />

      <div className="timeline__ruler">{timeSpans}</div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="timeline-items" direction="horizontal">
          {(dropProv) => (
            <div className="timeline__items" ref={dropProv.innerRef} {...dropProv.droppableProps}>
              {queue.map((item, idx) => (
                <Draggable key={item.id} draggableId={item.id} index={idx}>
                  {(dragProv, snapshot) => (
                    <div
                      className={
                        "timeline__item " + (snapshot.isDragging ? "timeline__item--dragging" : "")
                      }
                      ref={dragProv.innerRef}
                      {...dragProv.draggableProps}
                      {...dragProv.dragHandleProps}
                    >
                      <TimelineObject
                        id={item.id}
                        previewUrl={item.previewUrl}
                        speed={item.speed}
                        duration={item.duration}
                        size={size}
                        isDragging={snapshot.isDragging && !snapshot.isDropAnimating}
                        // complex key to reset drag/float states
                        key={
                          item.id +
                          String(snapshot.isDragging) +
                          String(snapshot.isDropAnimating) +
                          idx
                        }
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {dropProv.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
