/**
 * Entry point for the chart-kit fixture page (`/charts.html`).
 *
 * Its own Vite entry rather than a route, so the gallery needs nothing from the app
 * shell — which another chunk owns — and cannot collide with it.
 */

import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { createRoot } from "react-dom/client";

import "../index.css";
import ChartsFixture from "./ChartsFixture";

createRoot(document.getElementById("root")!).render(
  /* §8.10: the same root-level reduced-motion contract the app runs under. */
  <MotionConfig reducedMotion="user">
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ChartsFixture />
    </ThemeProvider>
  </MotionConfig>
);
