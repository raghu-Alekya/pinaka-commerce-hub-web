import { useAuth } from "./AuthContext";

export default function Permit({ module, action = "view", children }) {
  const { can } = useAuth();
  if (!can(module, action)) return null;
  return children;
}
