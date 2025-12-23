import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import StartPage from "./pages/StartPage";
import QuestionnairePage from "./pages/QuestionnairePage";
import ResultsPage from "./pages/ResultsPage";
import InsightsPage from "./pages/InsightsPage";
import ScenarioBuilderPage from "./pages/ScenarioBuilderPage";
import HistoryPage from "./pages/HistoryPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "start", element: <StartPage /> },
      { path: "questions", element: <QuestionnairePage /> },
      { path: "results", element: <ResultsPage /> },
      { path: "insights", element: <InsightsPage /> },
      { path: "scenario", element: <ScenarioBuilderPage /> },
      { path: "history", element: <HistoryPage /> }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
