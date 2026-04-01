import { getVoicePresentation } from "./voicePresentation";

export const getVoiceProfile = (id: string): any => {
  const presentation = getVoicePresentation(id);
  return {
    label: presentation.label,
    personaLabel: presentation.personaLabel,
    ensembleRoles: presentation.ensembleRoles,
  };
};

export const formatVoiceEnsembleRoles = (roles: string[]) => {
  return roles ? roles.join(", ") : "";
};
