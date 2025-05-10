document.addEventListener('DOMContentLoaded', function() {
  // Era data from summary.json
  const eras = [
    { start: 1900, end: 1949, name: "Idealized Femininity" },
    { start: 1950, end: 1989, name: "Binary Boom" },
    { start: 1990, end: 2009, name: "Fluidity Emerges" },
    { start: 2010, end: 2025, name: "Age of Expression" }
  ];
  
  // Get elements
  const prevEraBtn = document.querySelector('.prev-era');
  const nextEraBtn = document.querySelector('.next-era');
  const eraSegments = document.querySelectorAll('.era-segment');
  // Add at the end of your main initialization

// Debug check for global functions
console.log("Navigation functions available: ", {
  scrollToYear: typeof window.scrollToYear === 'function',
  updateEraProgress: typeof window.updateEraProgress === 'function'
});
  let currentYear = 1900; // Default start year
  
  // Update the progress bar segments based on current year
  function updateEraProgress(year) {
    currentYear = year;
    let currentEraIndex = -1;
    
    // Find which era the year belongs to and update segments
    eraSegments.forEach((segment, index) => {
      const startYear = parseInt(segment.dataset.startYear);
      const endYear = parseInt(segment.dataset.endYear);
      
      // Reset active state
      segment.classList.remove('active');
      
      // Check if current year is in this era
      if (year >= startYear && year <= endYear) {
        segment.classList.add('active');
        currentEraIndex = index;
        
        // Calculate progress through this era
        const progress = ((year - startYear) / (endYear - startYear + 1)) * 100;
        segment.querySelector('.segment-fill').style.width = `${progress}%`;
        
        // Create an era object and dispatch an event when the ads view is active
        if (document.querySelector('.ads-right-section').style.display !== 'none') {
          const currentEra = {
            start_year: startYear,
            end_year: endYear,
            era: segment.dataset.era
          };
          
          // Store current era for other components
          window.currentEra = currentEra;
          
          // Dispatch era change event
          const eraChangedEvent = new CustomEvent('eraChanged', {
            detail: { era: currentEra }
          });
          document.dispatchEvent(eraChangedEvent);
        }
      } else {
        // If year is past this era, fill completely
        if (year > endYear) {
          segment.querySelector('.segment-fill').style.width = '100%';
        } 
        // If year is before this era, empty the fill
        else if (year < startYear) {
          segment.querySelector('.segment-fill').style.width = '0%';
        }
      }
    });
    
    // Enable/disable navigation buttons
    prevEraBtn.disabled = currentEraIndex <= 0;
    nextEraBtn.disabled = currentEraIndex >= eras.length - 1;
    
    return currentEraIndex;
  }
  
  // Navigate to the start of an era
  function navigateToEra(eraIndex) {
    if (eraIndex >= 0 && eraIndex < eras.length) {
      const targetYear = eras[eraIndex].start;
      
      // Add a small delay to ensure setupScrolly has completed
      setTimeout(() => {
        if (typeof window.scrollToYear === 'function') {
          console.log(`Navigating to year ${targetYear}`);
          currentYear = targetYear;
          window.scrollToYear(targetYear);
        } else {
          console.error("scrollToYear function is not available yet");
        }
      }, 100); 
    }
  }
  
  // Click handlers for navigation buttons
  prevEraBtn.addEventListener('click', function() {
    const currentEraIndex = updateEraProgress(currentYear);
    if (currentEraIndex > 0) {
      navigateToEra(currentEraIndex - 1);
    }
  });
  
  nextEraBtn.addEventListener('click', function() {
    const currentEraIndex = updateEraProgress(currentYear);
    if (currentEraIndex < eras.length - 1) {
      navigateToEra(currentEraIndex + 1);
    }
  });
  
  // Click handlers for era segments
  eraSegments.forEach((segment, index) => {
    segment.addEventListener('click', function() {
      navigateToEra(index);
    });
  });
  
  // Expose these functions to the global scope
  window.updateEraProgress = updateEraProgress;
  window.navigateToEra = navigateToEra;
});