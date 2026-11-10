import { useEffect } from "react";
import { Controls } from "./Controls";
import { Preview } from "./Preview";
import { Timeline } from "./Timeline";
import { revokeAll } from "./util/blob-url-manager";

export function App() {
  useEffect(() => {
    revokeAll();
  }, []);

  return (
    <div className="app">
      <div className="app__controls">
        <Controls />
      </div>
      <div className="app__preview">
        <Preview />
      </div>
      <div className="app__timeline">
        <Timeline />
      </div>
    </div>
  );
}
