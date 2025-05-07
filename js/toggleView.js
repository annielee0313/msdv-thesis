document.addEventListener('DOMContentLoaded', function() {
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  const rightSection = document.querySelector('.right-section');
  const adsRightSection = document.querySelector('.ads-right-section');
  
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Remove active class from all buttons
      toggleBtns.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Handle section visibility based on selected mode
      const mode = this.dataset.mode;
      
      if (mode === 'notes') {
        // First show the notes container before triggering updates
        rightSection.style.display = 'flex';
        adsRightSection.style.display = 'none';
        
        // Dispatch an event that we've switched to notes view
        const viewToggledEvent = new CustomEvent('viewToggled', {
          detail: { view: 'notes' }
        });
        document.dispatchEvent(viewToggledEvent);
        
        // IMPORTANT: Trigger redraw of visualizations
        setTimeout(() => {
          // This needs to happen after the display change takes effect
          if (window.updateCharts) {
            window.updateCharts(); 
          }
          
          // Force resize event which helps D3 recalculate dimensions
          window.dispatchEvent(new Event('resize'));
        }, 10);
      } else if (mode === 'ads') {
        // Hide notes visualization, show ads visualization
        rightSection.style.display = 'none';
        adsRightSection.style.display = 'flex';
        
        // Dispatch an event that we've switched to ads view
        const viewToggledEvent = new CustomEvent('viewToggled', {
          detail: { view: 'ads' }
        });
        document.dispatchEvent(viewToggledEvent);
        
        // Get the current year from the active step
        const currentYear = parseInt(d3.select(".step.is-active").text());
        
        // Find which era this year belongs to
        if (window.summaryData) {
          const currentEra = window.summaryData.find(era => 
            currentYear >= era.start_year && currentYear <= era.end_year
          );
          
          if (currentEra) {
            console.log('Switching to ads view with era:', currentEra);
            
            // Store it for other components to use
            window.currentEra = currentEra;
            
            // Dispatch the era changed event
            const eraChangedEvent = new CustomEvent('eraChanged', { 
              detail: { era: currentEra }
            });
            document.dispatchEvent(eraChangedEvent);
          }
        }
      }
    });
  });
});