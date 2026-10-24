export type TemplateTypeOption = {
  value: string;
  name: string;
};

export function parseTemplateTypes(raw: string | null | undefined) {
  if (!raw) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  const options: TemplateTypeOption[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const value = "value" in item && typeof item.value === "string" ? item.value : "";
    const name = "name" in item && typeof item.name === "string" ? item.name : "";
    if (!value) {
      continue;
    }
    options.push({ value, name: name || value });
  }
  return options;
}

export function templateTypeName(
  type: string,
  options: TemplateTypeOption[],
) {
  return options.find((item) => item.value === type)?.name ?? (type || "—");
}
