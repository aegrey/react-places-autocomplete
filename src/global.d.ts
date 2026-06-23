declare global {
  interface Window {
    google?: typeof google;
    [key: string]: unknown;
  }
}

export {};
