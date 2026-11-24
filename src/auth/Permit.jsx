import { useAuth } from "./AuthContext";

export default function Permit({ module: moduleName, action = "view", children }) {
  const { can } = useAuth();
  return can(moduleName, action) ? children : null;
}
