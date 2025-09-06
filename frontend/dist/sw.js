
// Service Worker temporarily disabled to fix loading issues
// This file is kept minimal to prevent registration issues

console.log('Service Worker disabled for debugging');

// Minimal service worker that does nothing
self.addEventListener('install', (event) => {
  console.log('Service Worker installing (disabled)');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating (disabled)');
  self.clients.claim();
});

// No fetch interception - let all requests go through normally
self.addEventListener('fetch', (event) => {
  // Do nothing - let browser handle all requests normally
});
