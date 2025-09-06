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
  pwa: {
    name: "FarmXpress",
    themeColor: "#2e5c31",
    msTileColor: "#2e5c31",
    appleMobileWebAppCapable: "yes",
    appleMobileWebAppStatusBarStyle: "black",
    manifestOptions: {
      name: "FarmXpress",
      short_name: "FarmXpress",
      display: "standalone",
      start_url: "/",
      background_color: "#ffffff",
      theme_color: "#2e5c31",
      icons: [
        { src: "/img/icons/android-chrome-48x48.png", sizes: "48x48", type: "image/png", purpose: "any" },
        { src: "/img/icons/android-chrome-72x72.png", sizes: "72x72", type: "image/png", purpose: "any" },
        { src: "/img/icons/android-chrome-96x96.png", sizes: "96x96", type: "image/png", purpose: "any" },
        { src: "/img/icons/android-chrome-144x144.png", sizes: "144x144", type: "image/png", purpose: "any" },
        { src: "/img/icons/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: "/img/icons/android-chrome-256x256.png", sizes: "256x256", type: "image/png", purpose: "any maskable" },
        { src: "/img/icons/android-chrome-384x384.png", sizes: "384x384", type: "image/png", purpose: "any" },
        { src: "/img/icons/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        { src: "/img/icons/android-chrome-maskable-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
        { src: "/img/icons/android-chrome-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        { src: "/img/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        { src: "/img/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { src: "/img/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" }
      ],
    },
    iconPaths: {
      favicon32: "img/icons/favicon-32x32.png",
      favicon16: "img/icons/favicon-16x16.png",
      appleTouchIcon: "img/icons/apple-touch-icon.png",
      maskIcon: "img/icons/android-chrome-maskable-192x192.png",
      msTileImage: "img/icons/msapplication-icon-144x144.png",
    },
  },
})
