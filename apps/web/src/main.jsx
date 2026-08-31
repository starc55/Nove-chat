import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import "./styles/index.css";
import "./styles/xion-content.css";
import "./styles/landing-mobiuz.css";
import "./styles/storefront.css";
import "./styles/theme.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider><BrowserRouter><App /></BrowserRouter></LanguageProvider>
  </React.StrictMode>
);
