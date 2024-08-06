/* eslint-disable no-restricted-globals */

self.addEventListener('install', event => {
  console.log('Service worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service worker activating...');
});

self.addEventListener('fetch', function(event) {
  event.respondWith(fetch(event.request));
});
