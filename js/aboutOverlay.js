document.addEventListener('DOMContentLoaded', function() {
  const aboutButton = document.getElementById('about-button');
  const aboutOverlay = document.getElementById('about-overlay');
  const closeAbout = document.getElementById('close-about');
  
  // Show overlay when clicking the logo
  aboutButton.addEventListener('click', function() {
    aboutOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  });
  
  // Hide overlay when clicking the close button
  closeAbout.addEventListener('click', function() {
    aboutOverlay.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
  });
  
  // Also close when clicking outside the about container
  aboutOverlay.addEventListener('click', function(e) {
    if (e.target === aboutOverlay) {
      aboutOverlay.classList.add('hidden');
      document.body.style.overflow = '';
    }
  });
  
  // Close with escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !aboutOverlay.classList.contains('hidden')) {
      aboutOverlay.classList.add('hidden');
      document.body.style.overflow = '';
    }
  });

});