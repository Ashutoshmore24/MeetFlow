import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

import favicon from './assets/MeetFlow Logo.png'
const link = document.querySelector("link[rel~='icon']");
if (link) {
  link.href = favicon;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
