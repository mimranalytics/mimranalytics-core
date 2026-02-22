import React from "react";
import ReactDOM from "react-dom/client";
import "./css/index.css"; // or "./index.css" if that’s where your base styles are
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
