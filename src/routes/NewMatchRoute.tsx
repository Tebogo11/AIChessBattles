import { useMutation } from "convex/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { assignColors } from "../game/assignColors";
import { SetupScreen, type SetupValues } from "../ui/SetupScreen";

/**
 * The setup screen for the persisted app: collect prompts, create a match with
 * them stored, and redirect to its URL (SPEC §9.1). Colour is assigned at
 * creation so the stored white/black already reflect the choice (SPEC §4.6).
 */
export function NewMatchRoute() {
  const create = useMutation(api.matches.create);
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  const start = async (values: SetupValues) => {
    setStarting(true);
    const { white, black } = assignColors(values.first, values.second, values.randomizeColors);
    try {
      const id = await create({ white, black });
      void navigate(`/match/${id}`);
    } catch {
      setStarting(false);
    }
  };

  return <SetupScreen onStart={(v) => void start(v)} starting={starting} />;
}
