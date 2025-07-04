const { defineConfig } = require("@vue/cli-service")

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    // allowedHosts: "all",
    // host: "0.0.0.0",
    // port: 8083,
    // // Remove webSocketURL completely - let Vue handle it automatically
    // client: {
    //   overlay: {
    //     errors: true,
    //     warnings: false,
    //   },
    //   logging: "none",
    // },
    https:false,
    host: "localhost",
    port: 8083,
    client:{
      WebSocketURL: "ws://localhost:8083/ws",
      allowedHosts: "all",
    },
  },
})
