export const DetectType = {
  Component: "component",
  Action: "action",
} as const;

export type DetectType = (typeof DetectType)[keyof typeof DetectType];

export const detectTypeOptions = [
  { value: DetectType.Component, label: "零件" },
  { value: DetectType.Action, label: "行为" },
] as const;

export function isDetectType(value: unknown): value is DetectType {
  return value === DetectType.Component || value === DetectType.Action;
}

/** Analysis `type` sent to the check system when a task starts. */
export function analysisTypeForDetectType(detectType: DetectType) {
  return detectType === DetectType.Component ? "yolo" : "minicpm";
}

export function getDetectTypeLabel(value: string) {
  return detectTypeOptions.find((item) => item.value === value)?.label ?? value;
}
