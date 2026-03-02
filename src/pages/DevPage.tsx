import { AiThoughtsPanel } from "../features/ai/ui/AiThoughtsPanel";
import { PlaceholderPanel } from "../features/placeholders/PlaceholderPanel";

export const DevPage = () => (
  <section className="panel-section">
    <AiThoughtsPanel />
    <PlaceholderPanel
      title="Battle Placeholder"
      description="Battle systems are intentionally out of scope for this iteration."
      extensionPoint="features.battle.renderBattlePanel"
    />
  </section>
);
