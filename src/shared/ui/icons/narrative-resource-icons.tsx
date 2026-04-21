import type { SVGProps } from "react";

export interface NarrativeResourceIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

const ResourceIconWrapper = ({
  size = 24,
  className,
  children,
  ...props
}: NarrativeResourceIconProps & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="50" cy="50" r="42" />
    {children}
  </svg>
);

export const ProvidenceIcon = (props: NarrativeResourceIconProps) => (
  <ResourceIconWrapper {...props}>
    <path d="M22 50 Q50 24 78 50 Q50 76 22 50 Z" />
    <circle cx="50" cy="50" r="8" />
    <path d="M50 22 V30 M50 70 V78" />
    <path d="M33 33 L38 38 M67 33 L62 38" />
  </ResourceIconWrapper>
);

export const FortuneIcon = (props: NarrativeResourceIconProps) => (
  <ResourceIconWrapper {...props}>
    <circle cx="50" cy="50" r="22" />
    <path d="M50 26 L55 40 L70 40 L58 49 L62 63 L50 55 L38 63 L42 49 L30 40 L45 40 Z" />
    <path d="M50 14 V22 M50 78 V86 M14 50 H22 M78 50 H86" />
  </ResourceIconWrapper>
);

export const KarmaIcon = (props: NarrativeResourceIconProps) => (
  <ResourceIconWrapper {...props}>
    <path d="M32 32 C42 22 58 22 68 32" />
    <path d="M32 68 C42 78 58 78 68 68" />
    <path d="M50 24 V76" />
    <path d="M26 40 H74" />
    <path d="M34 40 L28 54 H40 Z" />
    <path d="M66 40 L60 54 H72 Z" />
  </ResourceIconWrapper>
);
