import { useAppUI } from "../context/AppUIContext";

export default function Toast() {
  const { toast } = useAppUI();
  if (!toast) return null;
  return <div className="app-toast">{toast}</div>;
}
