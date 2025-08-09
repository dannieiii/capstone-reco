const { defineConfig } = require("@vue/cli-service")

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    https: false,
    host: "localhost",
    port: 8083,
    allowedHosts: "all",
    client: {
      webSocketURL: "ws://localhost:8083/ws",
      overlay: {
        errors: true,
        warnings: false,
      },
      logging: "none",
    },
  },
})
