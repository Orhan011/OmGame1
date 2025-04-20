
// Theme preferences cleanup
document.addEventListener('DOMContentLoaded', function() {
  // Force dark theme
  document.documentElement.className = 'dark';
  
  // Remove any theme-related localStorage items
  if (localStorage.getItem('theme') || localStorage.getItem('theme_preference')) {
    localStorage.removeItem('theme');
    localStorage.removeItem('theme_preference');
    console.log('Tema tercihleri temizlendi');
  }
});
