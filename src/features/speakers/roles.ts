export type SpeakerRole = {
  name: string;
  gender: "male" | "female";
  voiceType: string;
  description: string;
};

export const SPEAKER_ROLES: SpeakerRole[] = [
  {
    name: "Tim",
    gender: "male",
    voiceType: "en_male_tim_uranus_bigtts",
    description: "male English speaker, calm and natural",
  },
  {
    name: "Dacey",
    gender: "female",
    voiceType: "en_female_dacey_uranus_bigtts",
    description: "female English speaker, clear and friendly",
  },
  {
    name: "Stokie",
    gender: "female",
    voiceType: "en_female_stokie_uranus_bigtts",
    description: "female English speaker, casual and expressive",
  },
  {
    name: "Tina",
    gender: "female",
    voiceType: "zh_female_yingyujiaoxue_uranus_bigtts",
    description: "female English teaching voice, suitable for explanations and teaching scenes",
  },
];

export const SPEAKER_ROLE_NAMES = SPEAKER_ROLES.map((r) => r.name) as [string, ...string[]];

export const SPEAKER_ROLE_NAMES_SET = new Set<string>(SPEAKER_ROLE_NAMES);

const roleByName = new Map<string, SpeakerRole>();
for (const role of SPEAKER_ROLES) {
  roleByName.set(role.name, role);
  roleByName.set(role.name.toLowerCase(), role);
}

export function getSpeakerRoleByName(name: string): SpeakerRole | undefined {
  return roleByName.get(name.trim()) ?? roleByName.get(name.trim().toLowerCase());
}

export function getVoiceTypeForSpeaker(
  name: string | undefined | null,
  fallbackVoiceType: string,
): string {
  if (!name) return fallbackVoiceType;
  const role = getSpeakerRoleByName(name);
  return role ? role.voiceType : fallbackVoiceType;
}
