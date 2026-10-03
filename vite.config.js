import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_API_PROXY_TARGET;
  const authProxyTarget = env.VITE_AUTH_PROXY_TARGET || proxyTarget;

  const proxy = {};

  if (authProxyTarget) {
    proxy["/api/v1/auth"] = {
      target: authProxyTarget,
      changeOrigin: true,
      secure: false,
    };
    proxy["/api/v1/users"] = {
      target: authProxyTarget,
      changeOrigin: true,
      secure: false,
    };
  }

  if (proxyTarget) {
    proxy["/api"] = {
      target: proxyTarget,
      changeOrigin: true,
      secure: false,
    };
    proxy["/connector"] = {
      target: proxyTarget,
      changeOrigin: true,
      secure: false,
    };
  }

  return {
    plugins: [react()],
    server: {
      watch: {
        ignored: ["**/dist/**"],
      },
      ...(Object.keys(proxy).length ? { proxy } : {}),
    },
  };
});
