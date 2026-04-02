import { useCallback, useEffect, useState } from "react";

function measureContentWidth(element: HTMLElement): number {
  const styles = window.getComputedStyle(element);
  const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(styles.paddingRight) || 0;
  return Math.max(0, element.clientWidth - paddingLeft - paddingRight);
}

export function useElementContentWidth<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [contentWidth, setContentWidth] = useState(0);

  const ref = useCallback((node: T | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) {
      setContentWidth(0);
      return;
    }

    const updateWidth = () => {
      setContentWidth(measureContentWidth(element));
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return { ref, contentWidth };
}
