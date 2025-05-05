export function setupScrolly(availableYears, onStepChange) {
    const scrollInner = d3.select("#scroll-inner");
    scrollInner.html("");
    
    // Keep track of translateX in this scope
    let translateX = 0;
    let manualScrollMode = false;
    // Add this flag to track first scroll
    let isFirstScroll = true;
    let lastScrollTop = 0;
  
    const stepSize = 120;
    const stepGap = 64;
    const stepCount = availableYears.length;
  
    const spacerWidth = window.innerWidth / 2 - (stepSize / 2);
  
    // Add left spacer
    scrollInner.append("div")
      .attr("class", "spacer")
      .style("width", `${spacerWidth}px`);
  
    // Add timeline line
    scrollInner.append("div")
      .attr("class", "timeline-line");
  
    // Create steps with data-year attribute and indicators
    const steps = scrollInner.selectAll(".step")
      .data(availableYears)
      .enter()
      .append("div")
      .attr("class", "step")
      .attr("data-year", d => d)
      .text(d => d);
      
    // Add indicators for ads and milestones
    steps.each(function(year) {
      const stepEl = d3.select(this);
      
      // Check for milestones
      const hasMilestone = window.milestones && 
                          window.milestones.some(m => m.year === year);
      
      // Check for ads and count them
      const yearAds = window.adData ? 
                     window.adData.filter(ad => ad.year === year) : [];
      const adCount = yearAds.length;
      
      // Add ad indicators if applicable
      if (adCount > 0) {
        const adIndicators = stepEl.append("div")
          .attr("class", "ad-indicators");
        
        // Create dots based on number of ads (max 10 dots)
        const dotsToShow = Math.min(adCount, 10);
        for (let i = 0; i < dotsToShow; i++) {
          adIndicators.append("div")
            .attr("class", "ad-dot");
        }
      }
      
      // Add milestone indicator if applicable
      if (hasMilestone) {
        stepEl.append("div")
          .attr("class", "milestone-indicator");
      }
    });
  
    // Add right spacer
    scrollInner.append("div")
      .attr("class", "spacer")
      .style("width", `${spacerWidth}px`);
      
    // Calculate true total width:
    const totalWidth =
      (stepSize * stepCount) +                     // step widths
      (stepGap * (stepCount + 5)) +                // flex gaps between steps
      (2 * spacerWidth);                           // spacers on both ends
  
    scrollInner.style("width", `${totalWidth}px`);
  
    let lastYear = null;
  
    // Initialize first year
    const firstStep = availableYears[0];
    lastYear = firstStep;
    d3.selectAll(".step").classed("is-active", d => d === firstStep);
    onStepChange(firstStep);
  
    // Modified scroll handler for smooth scrolling
    window.addEventListener("scroll", () => {
      if (manualScrollMode) return;
      
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const scrollHeight = document.body.scrollHeight - window.innerHeight;
        
        // Special handling for first scroll to prevent large jumps
        if (isFirstScroll) {
          // Use relative movement for first scroll instead of absolute position
          const scrollDelta = scrollTop - lastScrollTop;
          const maxTranslateX = totalWidth - window.innerWidth;
          
          // Apply a gentler translation based on scroll delta
          translateX -= (scrollDelta / 10); // Reduce sensitivity for first scroll
          translateX = Math.max(-maxTranslateX, Math.min(0, translateX));
          
          // After a small movement, switch to normal scrolling
          if (Math.abs(scrollDelta) > 5) {
            isFirstScroll = false;
          }
        } else {
          // Normal scrolling after first movement
          const progress = Math.min(1, scrollTop / scrollHeight);
          const maxTranslateX = totalWidth - window.innerWidth;
          translateX = -progress * maxTranslateX;
          translateX = Math.max(-maxTranslateX, Math.min(0, translateX));
        }
        
        // Update last scroll position
        lastScrollTop = scrollTop;
        
        // Apply transform
        scrollInner.style("transform", `translateX(${translateX}px)`);
    
        // Find closest step based on viewport center
        updateClosestStep();
      });
    }, { passive: true });

    // Helper function to determine and update the closest step
    function updateClosestStep() {
      const centerX = window.innerWidth / 2;
      let closestStep = null;
      let minDistance = Infinity;
    
      d3.selectAll(".step").each(function(d) {
        const box = this.getBoundingClientRect();
        const stepCenter = box.left + box.width / 2;
        const distance = Math.abs(centerX - stepCenter);
    
        if (distance < minDistance) {
          minDistance = distance;
          closestStep = d;
        }
      });
    
      if (closestStep !== lastYear) {
        lastYear = closestStep;
        d3.selectAll(".step").classed("is-active", d => d === closestStep);
        
        if (window.updateEraProgress) {
          window.updateEraProgress(closestStep);
        }
        
        onStepChange(closestStep);
      }
    }

    // Key improvement: scrollToYear now updates page scroll position
    window.scrollToYear = function(year) {
      manualScrollMode = true;
      isFirstScroll = false; // Important: reset first scroll flag
      
      // Find the step with this year
      const yearIndex = availableYears.indexOf(year);
      if (yearIndex === -1) return;
      
      // Calculate what percentage through the timeline this year is
      const yearProgress = yearIndex / (availableYears.length - 1);
      
      // Calculate the appropriate scroll position for this percentage
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      const targetScrollY = yearProgress * scrollHeight;
      
      // Set scroll position directly without smooth scrolling
      window.scrollTo(0, targetScrollY);
      
      // Calculate and apply the appropriate translateX
      const maxTranslateX = totalWidth - window.innerWidth;
      translateX = -yearProgress * maxTranslateX;
      translateX = Math.max(-maxTranslateX, Math.min(0, translateX));
      scrollInner.style("transform", `translateX(${translateX}px)`);
      
      // Update active step
      lastYear = year;
      d3.selectAll(".step").classed("is-active", d => d === year);
      
      // Callbacks
      if (window.updateEraProgress) {
        window.updateEraProgress(year);
      }
      onStepChange(year);
      
      // Re-enable scrolling after a delay
      setTimeout(() => {
        manualScrollMode = false;
      }, 500);
    };
}
