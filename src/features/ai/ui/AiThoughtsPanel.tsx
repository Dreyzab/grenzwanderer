import { useAiThoughts } from "../hooks/useAiThoughts";

const unwrapOptionalString = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "object" && value !== null && "tag" in value) {
    const tagged = value as { tag?: string; value?: unknown };
    if (tagged.tag === "some" && typeof tagged.value === "string") {
      return tagged.value;
    }
  }

  return null;
};

export const AiThoughtsPanel = () => {
  const thoughts = useAiThoughts();

  return (
    <section className="panel-section">
      <header className="panel-header">
        <div>
          <h2>AI Thoughts</h2>
          <p>Live `ai_request` queue for the current player.</p>
        </div>
      </header>

      <article className="card">
        {thoughts.length === 0 ? (
          <p className="muted">No AI requests yet.</p>
        ) : (
          <ul className="unstyled-list">
            {thoughts.map((entry) => (
              <li key={entry.id.toString()} className="secret-row">
                <strong>{entry.kind}</strong>
                <span>
                  status={entry.status} requestId={entry.requestId}
                </span>
                {unwrapOptionalString(entry.responseJson) ? (
                  <pre className="code-box">
                    {unwrapOptionalString(entry.responseJson)}
                  </pre>
                ) : null}
                {unwrapOptionalString(entry.error) ? (
                  <p className="error">{unwrapOptionalString(entry.error)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
};
