export const BRANCHES = [
  { value: "carissa_1", label: "Carissa 1 Main" },
  { value: "carissa_2", label: "Carissa 2 Branch" },
  { value: "antipolo", label: "Antipolo Branch" },
  { value: "cainta", label: "Cainta Branch" },
] as const;

export const BRANCH_LABELS: Record<string, string> = {
  carissa_1: "Carissa 1 Main",
  carissa_2: "Carissa 2 Branch",
  antipolo: "Antipolo Branch",
  cainta: "Cainta Branch",
};

export function getBranchLabel(value: string): string {
  return BRANCH_LABELS[value] ?? value;
}
