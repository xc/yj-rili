export const DetectType = {
  Component: "component",
  Behavior: "behavior",
} as const;

export type DetectType = (typeof DetectType)[keyof typeof DetectType];

export const detectTypeOptions = [
  { value: DetectType.Component, label: "零件" },
  { value: DetectType.Behavior, label: "行为" },
] as const;

export function isDetectType(value: unknown): value is DetectType {
  return value === DetectType.Component || value === DetectType.Behavior;
}

/** Analysis `type` sent to the check system when a task starts. */
export function analysisTypeForDetectType(detectType: DetectType) {
  return detectType === DetectType.Component ? "yolo" : "minicpm";
}

export function getDetectTypeLabel(value: string) {
  return detectTypeOptions.find((item) => item.value === value)?.label ?? value;
}

export type ExistRule = {
  id: string;
  type: "exist";
  ruleName: string;
  condition: {
    area: string;
    objectName: string;
    minTime?: number;
  };
};

export type SequenceRule = {
  id: string;
  type: "sequence";
  ruleName: string;
  condition: { area: string; objectName: string }[];
};

export type RuleItem = ExistRule | SequenceRule;

export type RuleContent = RuleItem[];
