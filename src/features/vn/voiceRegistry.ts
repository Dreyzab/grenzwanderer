export const getVoiceProfile = (id: string): any => {
  const label = id
    .replace(/^attr_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  if (id === "attr_social") {
    return { label: "Charisma", personaLabel: "Charisma", ensembleRoles: [] };
  }

  return { label, personaLabel: label, ensembleRoles: [] };
};

export const formatVoiceEnsembleRoles = (roles: string[]) => {
  return roles ? roles.join(", ") : "";
};
