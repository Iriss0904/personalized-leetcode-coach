const HAN_SCRIPT = /\p{Script=Han}/u;

export function englishSystemText(
  value: string | null | undefined,
  fallback: string,
) {
  const text = value?.trim();

  if (!text || HAN_SCRIPT.test(text)) {
    return fallback;
  }

  return text;
}
