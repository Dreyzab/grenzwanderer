import type { ReactNode, SVGProps } from "react";

export interface GameIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

const IconWrapper = ({
  size = 24,
  className,
  children,
  ...props
}: GameIconProps & { children: ReactNode }) => (
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

export const IconDeptBrain = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <circle cx="50" cy="50" r="8" fill="currentColor" />
    <path d="M50 50 L30 30 M50 50 L70 30 M50 50 L30 70 M50 50 L70 70" />
    <circle cx="30" cy="30" r="5" />
    <circle cx="70" cy="30" r="5" />
    <circle cx="30" cy="70" r="5" />
    <circle cx="70" cy="70" r="5" />
  </IconWrapper>
);

export const IconDeptCharacter = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <circle cx="50" cy="30" r="7" />
    <path d="M35 50 C35 40 65 40 65 50" />
    <circle cx="30" cy="50" r="5" />
    <path d="M20 70 C20 60 40 60 40 70" />
    <circle cx="70" cy="50" r="5" />
    <path d="M60 70 C60 60 80 60 80 70" />
  </IconWrapper>
);

export const IconDeptBody = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <circle cx="50" cy="35" r="12" />
    <path d="M25 75 C25 55 75 55 75 75" />
  </IconWrapper>
);

export const IconDeptSoul = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <path d="M50 35 C50 15 20 15 20 40 C20 60 50 80 50 80 C50 80 80 60 80 40 C80 15 50 15 50 35 Z" />
    <path d="M15 15 L25 25 M85 15 L75 25 M15 65 L25 55 M85 65 L75 55" />
  </IconWrapper>
);

export const IconDeptSpirit = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <path d="M50 20 C50 20 25 50 35 70 C40 80 60 80 65 70 C75 50 50 20 50 20 Z" />
    <path
      d="M50 40 C50 40 40 60 45 70 C50 75 55 75 55 70 C60 60 50 40 50 40 Z"
      fill="currentColor"
    />
  </IconWrapper>
);

export const IconDeptShadow = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <path d="M65 25 A 25 25 0 1 0 75 65 A 32 32 0 0 1 65 25 Z" />
  </IconWrapper>
);

export const IconLogic = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <polygon points="50,25 70,35 70,65 50,75 30,65 30,35" />
    <circle cx="50" cy="50" r="5" />
    <path d="M50 50 V25 M50 50 L70 65 M50 50 L30 65" />
  </IconWrapper>
);

export const IconPerception = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <path d="M25 50 Q50 20 75 50 Q50 80 25 50 Z" />
    <circle cx="50" cy="50" r="8" />
  </IconWrapper>
);

export const IconEncyclopedia = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <path d="M35 30 C35 30 45 25 50 30 C55 25 65 30 65 30 V70 C65 70 55 65 50 70 C45 65 35 70 35 70 Z" />
    <path d="M50 30 V70" />
  </IconWrapper>
);

export const IconAuthority = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <path d="M25 65 L25 35 L40 50 L50 25 L60 50 L75 35 L75 65 Z" />
    <path d="M25 75 H75" />
  </IconWrapper>
);

export const IconCharisma = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <polygon points="50,25 55,45 75,50 55,55 50,75 45,55 25,50 45,45" />
  </IconWrapper>
);

export const IconVolition = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <path d="M40 70 V35 L50 25 L60 35 V70 Z" />
    <path d="M30 70 H70" />
  </IconWrapper>
);

export const IconAgility = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <path d="M55 25 L35 55 H60 L45 80" />
  </IconWrapper>
);

export const IconEndurance = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <path d="M25 30 H75 V50 C75 70 50 80 50 80 C50 80 25 70 25 50 Z" />
    <path d="M50 30 V80" />
  </IconWrapper>
);

export const IconSenses = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <circle cx="50" cy="70" r="5" fill="currentColor" />
    <path d="M35 55 A20 20 0 0 1 65 55" />
    <path d="M25 40 A35 35 0 0 1 75 40" />
    <path d="M15 25 A45 45 0 0 1 85 25" strokeDasharray="4 4" />
  </IconWrapper>
);

export const IconEmpathy = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <circle cx="40" cy="40" r="8" />
    <path d="M25 70 C25 55 55 55 55 70" />
    <circle cx="60" cy="50" r="8" />
    <path d="M45 80 C45 65 75 65 75 80" />
  </IconWrapper>
);

export const IconImagination = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <path d="M50 30 C35 30 30 45 35 60 C40 70 40 75 40 75 H60 C60 75 60 70 65 60 C70 45 65 30 50 30 Z" />
    <path d="M40 75 H60 V80 H40 Z" />
    <path d="M45 85 H55" />
  </IconWrapper>
);

export const IconIntuition = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <path d="M50 25 L35 50 L50 75 L65 50 Z" />
    <circle cx="50" cy="50" r="5" />
    <path d="M50 15 V25 M50 75 V85 M15 50 H25 M75 50 H85" />
  </IconWrapper>
);

export const IconGambling = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <rect x="35" y="25" width="30" height="50" rx="2" />
    <path d="M50 40 L55 45 L50 50 L45 45 Z" fill="currentColor" />
    <circle cx="40" cy="30" r="2" fill="currentColor" />
    <circle cx="60" cy="70" r="2" fill="currentColor" />
  </IconWrapper>
);

export const IconOccultism = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <path d="M50 25 L56 42 H74 L59 52 L65 70 L50 59 L35 70 L41 52 L26 42 H44 Z" />
  </IconWrapper>
);

export const IconTradition = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <path d="M35 25 H65 V35 L55 50 L65 65 V75 H35 V65 L45 50 L35 35 Z" />
    <path d="M42 35 V42 L48 50 L52 50 L58 42 V35 Z" fill="currentColor" />
  </IconWrapper>
);

export const IconDeception = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <path d="M35 35 C35 25 65 25 65 35 C65 55 50 70 50 70 C50 70 35 55 35 35 Z" />
    <circle cx="43" cy="40" r="3" fill="currentColor" />
    <circle cx="57" cy="40" r="3" fill="currentColor" />
    <path d="M45 55 Q50 60 55 55" />
    <path d="M25 25 L75 75" strokeWidth="2" strokeDasharray="4 4" />
  </IconWrapper>
);

export const IconIntrusion = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <circle cx="50" cy="40" r="12" />
    <path d="M45 50 L40 70 H60 L55 50" />
  </IconWrapper>
);

export const IconStealth = (props: GameIconProps) => (
  <IconWrapper {...props}>
    <path d="M25 50 C25 35 75 35 75 50 Z" />
    <circle cx="40" cy="45" r="4" fill="currentColor" />
    <circle cx="60" cy="45" r="4" fill="currentColor" />
    <path d="M25 50 C25 65 75 65 75 50" strokeDasharray="4 4" />
  </IconWrapper>
);

export type VoiceOrDeptId =
  | "logic"
  | "perception"
  | "encyclopedia"
  | "authority"
  | "charisma"
  | "volition"
  | "endurance"
  | "agility"
  | "senses"
  | "intuition"
  | "empathy"
  | "imagination"
  | "gambling"
  | "occultism"
  | "tradition"
  | "deception"
  | "intrusion"
  | "stealth"
  | "intellect"
  | "social"
  | "physical"
  | "psyche"
  | "spirit"
  | "shadow";

export const GameIcon = ({
  name,
  ...props
}: GameIconProps & { name: VoiceOrDeptId | string }) => {
  switch (name) {
    case "intellect":
      return <IconDeptBrain {...props} />;
    case "social":
      return <IconDeptCharacter {...props} />;
    case "physical":
      return <IconDeptBody {...props} />;
    case "psyche":
      return <IconDeptSoul {...props} />;
    case "spirit":
      return <IconDeptSpirit {...props} />;
    case "shadow":
      return <IconDeptShadow {...props} />;
    case "logic":
      return <IconLogic {...props} />;
    case "perception":
      return <IconPerception {...props} />;
    case "encyclopedia":
      return <IconEncyclopedia {...props} />;
    case "authority":
      return <IconAuthority {...props} />;
    case "charisma":
      return <IconCharisma {...props} />;
    case "volition":
      return <IconVolition {...props} />;
    case "agility":
      return <IconAgility {...props} />;
    case "endurance":
      return <IconEndurance {...props} />;
    case "senses":
      return <IconSenses {...props} />;
    case "empathy":
      return <IconEmpathy {...props} />;
    case "imagination":
      return <IconImagination {...props} />;
    case "intuition":
      return <IconIntuition {...props} />;
    case "gambling":
      return <IconGambling {...props} />;
    case "occultism":
      return <IconOccultism {...props} />;
    case "tradition":
      return <IconTradition {...props} />;
    case "deception":
      return <IconDeception {...props} />;
    case "intrusion":
      return <IconIntrusion {...props} />;
    case "stealth":
      return <IconStealth {...props} />;
    default:
      return <IconDeptBrain {...props} />;
  }
};
