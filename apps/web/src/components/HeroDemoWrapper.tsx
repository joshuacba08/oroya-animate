/**
 * Wrapper that lazily imports the scene factory and renders LiveDemo.
 * Used with client:only="react" in Astro pages.
 */
import { lazy, Suspense } from "react";
import LiveDemo from "./LiveDemo";
import { createHelloCubeScene } from "../scenes/hello-cube";

export default function HeroDemoWrapper() {
  return (
    <div className="w-full aspect-video max-h-[400px] rounded-2xl overflow-hidden border border-base-300/30">
      <LiveDemo createScene={createHelloCubeScene} />
    </div>
  );
}
