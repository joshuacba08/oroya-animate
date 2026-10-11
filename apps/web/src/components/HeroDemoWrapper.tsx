import LiveDemo from "./LiveDemo";
const createScene = async (aspect: number) => (await import("../scenes/hello-cube")).createHelloCubeScene(aspect);
export default function HeroDemoWrapper() {
  return <div className="w-full aspect-video max-h-[400px] rounded-2xl overflow-hidden border border-base-300/30">
    <LiveDemo createScene={createScene} />
  </div>;
}
