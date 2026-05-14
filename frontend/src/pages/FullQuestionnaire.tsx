import type { CalculateRequest } from "../api/greenr";

// Full questionnaire inputs are now handled directly inside QuestionnairePage
// as an immersive step-by-step flow. This file is kept for compatibility.
export default function FullQuestionnaire(_props: {
  draft: CalculateRequest;
  setDraft: React.Dispatch<React.SetStateAction<CalculateRequest>>;
}) {
  return null;
}
