import {defineConfig, PluginOption} from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths"
import * as fs from "fs";

const fullReloadAlways: PluginOption = {
  name: 'full-reload-always',
  handleHotUpdate({server}) {
    server.ws.send({type: "full-reload"})
    return []
  },
} as PluginOption

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8000,
    host: '0.0.0.0',
    https: {
      cert: fs.readFileSync('./certs/server-cert.pem'),
      key: fs.readFileSync('./certs/server-key.pem')
    },
  },
  esbuild: {
    supported: {
      'top-level-await': true
    },
  },
  base: process.env.NODE_ENV === 'production' ? '/MeshMurmur/' : '/',
  plugins: [react(), tsconfigPaths(), fullReloadAlways],
})
