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

  // Add logo hover animation similar to landing.html
  const logo = document.querySelector('.fluidnotes-logo');
  
  logo.addEventListener('mouseenter', () => {
    // If GSAP is available, use it for the animation
    if (window.gsap) {
      gsap.to(logo, {
        duration: 0.5,
        scale: 1.05,
        rotation: 2,
        ease: "power1.out"
      });
    } else {
      // Fallback to CSS transitions if GSAP isn't loaded
      logo.style.transform = 'scale(1.05) rotate(2deg)';
    }
  });
  
  logo.addEventListener('mouseleave', () => {
    if (window.gsap) {
      gsap.to(logo, {
        duration: 0.5,
        scale: 1,
        rotation: 0,
        ease: "power1.inOut"
      });
    } else {
      logo.style.transform = 'scale(1) rotate(0)';
    }
  });
});