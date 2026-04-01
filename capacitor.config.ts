import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'Unigramm',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: false
    }
  }
};

export default config;
