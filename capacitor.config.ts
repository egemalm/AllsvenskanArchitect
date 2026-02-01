import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.egemalm.architect',
  appName: 'Allsvenskan Architect',
  webDir: 'dist',
  backgroundColor: '#020617', 
  // ADD THIS BLOCK:
 /* server: {
  url: 'http://192.168.86.41:3000',
  cleartext: true
}, 
*/
  plugins: {
    SplashScreen: {
      launchAutoHide: false, 
      backgroundColor: '#020617',
      showSpinner: true,
      androidScaleType: 'CENTER_CROP',
      iosSpinnerStyle: 'small',
      spinnerColor: '#22c55e',
    },
  },
};

export default config;