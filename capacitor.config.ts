import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uk.getcurated.app',
  appName: 'Curated',
  webDir: 'dist-native',
  // Colour behind the status bar / home-indicator strips (the app's cream background).
  backgroundColor: '#FAF7F2',
  ios: {
    // Keep the whole web view inside the safe area (below the notch/status bar,
    // above the home indicator). The web build has no viewport-fit=cover, so its
    // env(safe-area-inset-*) values stay 0 and nothing gets double-padded.
    contentInset: 'always',
  },
};

export default config;
