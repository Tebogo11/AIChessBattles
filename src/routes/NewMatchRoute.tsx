import { useMutation } from "convex/react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { BotConfig } from "../game/botConfig";
import { SetupFlow } from "../ui/SetupFlow";

interface EditState {
  editConfigs?: { white: BotConfig; black: BotConfig };
}

/**
 * The setup flow for the persisted app: edit prompts, preview personas, then
 * create a match with the frozen personas stored on it and redirect to its URL
 * (SPEC §6, §9.1). "Edit prompts" from a result card arrives here with configs
 * to pre-fill (SPEC §9.4).
 */
export function NewMatchRoute() {
  const create = useMutation(api.matches.create);
  const navigate = useNavigate();
  const location = useLocation();
  const [creating, setCreating] = useState(false);

  const edit = (location.state as EditState | null)?.editConfigs;
  const initial = edit ? { first: edit.white, second: edit.black } : undefined;

  const confirm = async (white: BotConfig, black: BotConfig) => {
    setCreating(true);
    try {
      const id = await create({ white, black });
      void navigate(`/match/${id}`);
    } catch {
      setCreating(false);
    }
  };

  return <SetupFlow onConfirm={(w, b) => void confirm(w, b)} creating={creating} initial={initial} />;
}
