import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uk.getcurated.app',
  appName: 'Curated',
  webDir: 'dist-native',
  // Shown while the web view loads. Safe-area handling lives in ContainerViewController.swift.
  backgroundColor: '#FAF7F2',
};

export default config;
