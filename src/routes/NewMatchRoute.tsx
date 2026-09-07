import { useMutation } from "convex/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { BotConfig } from "../game/botConfig";
import { SetupFlow } from "../ui/SetupFlow";

/**
 * The setup flow for the persisted app: edit prompts, preview personas, then
 * create a match with the frozen personas stored on it and redirect to its URL
 * (SPEC §6, §9.1).
 */
export function NewMatchRoute() {
  const create = useMutation(api.matches.create);
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const confirm = async (white: BotConfig, black: BotConfig) => {
    setCreating(true);
    try {
      const id = await create({ white, black });
      void navigate(`/match/${id}`);
    } catch {
      setCreating(false);
    }
  };

  return <SetupFlow onConfirm={(w, b) => void confirm(w, b)} creating={creating} />;
}
