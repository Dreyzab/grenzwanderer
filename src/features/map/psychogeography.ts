import type { RuntimeMapPoint } from "./types";

interface PsychogeographicInput {
  point: RuntimeMapPoint;
  activeLens: { caseTitle: string; hypothesisText: string } | null;
  internalizedThought: { title: string; internalized: boolean } | null;
  heat: number;
  tension: number;
  isCurrentLocation: boolean;
}

export interface PsychogeographicNote {
  title: string;
  body: string;
}

export const derivePsychogeographicNote = ({
  point,
  activeLens,
  internalizedThought,
  heat,
  tension,
  isCurrentLocation,
}: PsychogeographicInput): PsychogeographicNote => {
  if (activeLens) {
    return {
      title: activeLens.caseTitle,
      body: activeLens.hypothesisText,
    };
  }

  if (internalizedThought?.internalized) {
    return {
      title: "Internalized",
      body: internalizedThought.title,
    };
  }

  if (isCurrentLocation) {
    return {
      title: "Present",
      body: point.title,
    };
  }

  if (heat >= 70) {
    return {
      title: "Hot",
      body: `${point.title} — active`,
    };
  }

  if (tension >= 50) {
    return {
      title: "Tense",
      body: `${point.title} — watch closely`,
    };
  }

  return {
    title: point.title,
    body: "",
  };
};
