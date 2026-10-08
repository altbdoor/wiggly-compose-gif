import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div>
      <p>Version 2 WIP</p>
      <p>
        <a href="./v1/">See version 1</a>
      </p>
      <p>
        <a href="./help.html">Need help?</a>
      </p>
    </div>
  </StrictMode>,
);
