interface PlaceholderPanelProps {
  title: string;
  description: string;
  extensionPoint: string;
}

export const PlaceholderPanel = ({
  title,
  description,
  extensionPoint,
}: PlaceholderPanelProps) => {
  return (
    <section className="panel-section">
      <header className="panel-header">
        <h2>{title}</h2>
      </header>
      <article className="card placeholder-card">
        <p>{description}</p>
        <p>
          Extension point: <code>{extensionPoint}</code>
        </p>
      </article>
    </section>
  );
};
