import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { ReasoningPage } from "./pages/ReasoningPage";
import { DebatePage } from "./pages/DebatePage";
import { HistoryPage } from "./pages/HistoryPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/reasoning",
    Component: ReasoningPage,
  },
  {
    path: "/debate",
    Component: DebatePage,
  },
  {
    path: "/history",
    Component: HistoryPage,
  },
]);
