export const BRANCHES = [
  { value: "carissa_1", label: "Carissa 1 Main" },
  { value: "carissa_2", label: "Carissa 2" },
  { value: "antipolo", label: "Antipolo" },
  { value: "cainta", label: "Cainta" },
] as const;

export const BRANCH_LABELS: Record<string, string> = {
  carissa_1: "Carissa 1 Main",
  carissa_2: "Carissa 2",
  antipolo: "Antipolo",
  cainta: "Cainta",
};

export function getBranchLabel(value: string): string {
  return BRANCH_LABELS[value] ?? value;
}
