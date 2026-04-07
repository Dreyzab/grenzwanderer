import { useEffect, useState } from "react";
import { resetPretextCaches } from "../lib/pretext";

export function usePretextFontVersion(fonts: string[] = []) {
  const [version, setVersion] = useState(0);
  const fontsKey = fonts.join("\0");

  useEffect(() => {
    if (typeof document === "undefined" || !("fonts" in document)) return;

    const fontSet = document.fonts;
    let disposed = false;

    const refresh = () => {
      resetPretextCaches();
      if (!disposed) {
        setVersion((current) => current + 1);
      }
    };

    const onLoadingDone = () => {
      refresh();
    };

    fontSet.addEventListener?.("loadingdone", onLoadingDone);

    const loadFonts = async () => {
      if (fonts.length > 0) {
        await Promise.allSettled(fonts.map((font) => fontSet.load(font)));
      }

      await fontSet.ready;
      refresh();
    };

    void loadFonts();

    return () => {
      disposed = true;
      fontSet.removeEventListener?.("loadingdone", onLoadingDone);
    };
  }, [fontsKey]); // eslint-disable-line react-hooks/exhaustive-deps -- fontsKey = fonts.join("\0"); `fonts` ref alone would loop

  return version;
}
