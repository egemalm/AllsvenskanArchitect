import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.egemalm.architect',
  appName: 'Allsvenskan Architect',
  webDir: 'dist',
  // 1. Set the background of the native webview to match your app's theme
  backgroundColor: '#020617', 
  plugins: {
    SplashScreen: {
      // 2. Stop the splash from hiding automatically
      launchAutoHide: false, 
      // 3. Match the splash background to the webview background
      backgroundColor: '#020617',
      // Optional: Add a spinner to show it's loading
      showSpinner: true,
      androidScaleType: 'CENTER_CROP',
      iosSpinnerStyle: 'small',
      spinnerColor: '#22c55e',
    },
  },
};

export default config;