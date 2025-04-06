// This file is deprecated - redirects to audioMemory.js
// Used for backward compatibility
// Make sure you're using audioMemory.js for actual functionality

// Detect if audioMemory.js is already loaded
if (typeof playSound === 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    const script = document.createElement('script');
    script.src = '/static/js/audioMemory.js';
    document.head.appendChild(script);
  });
}
