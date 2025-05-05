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
        // Cancel any pending visualization updates
        if (window.pendingChartUpdate) {
          clearTimeout(window.pendingChartUpdate);
        }
        
        // Hide notes visualization, show ads visualization
        rightSection.style.display = 'none';
        adsRightSection.style.display = 'flex';
        
        // Initialize/update ads visualization based on current era
        const currentEraElement = document.querySelector('.era-segment .segment-fill[style*="width: 100%"]');
        if (currentEraElement) {
          const eraSegment = currentEraElement.parentElement;
          const startYear = eraSegment.dataset.startYear;
          const endYear = eraSegment.dataset.endYear;
          const eraName = eraSegment.dataset.era;
          
          // This function would be defined in your ads visualization code
          if (window.updateAdsVisualization) {
            window.updateAdsVisualization(startYear, endYear, eraName);
          }
        }
      }
    });
  });
});