import 'dotenv/config';

export default {
  expo: {
    name: "Cargo Delivery",
    slug: "cargo-delivery",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      API_BASE_URL: process.env.API_BASE_URL || 'http://192.168.1.108:8000',
      API_TIMEOUT: process.env.API_TIMEOUT || '15000',
      DEBUG_MODE: process.env.DEBUG_MODE || 'true',
      APP_VERSION: '1.0.0',
      LOCATION_TIMEOUT: process.env.LOCATION_TIMEOUT || '15000',
      LOCATION_ACCURACY: process.env.LOCATION_ACCURACY || 'high'
    }
  }
};
