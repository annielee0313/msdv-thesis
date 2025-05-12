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
      
    // Add scroll down guidance text
    scrollInner.append("div")
      .attr("class", "scroll-guidance")
      .text("Scroll through Gender Milestones")
      .style("position", "absolute")
      .style("left", `${spacerWidth - 180}px`) // Position to the left of 1900
      .style("bottom", "-18px") // Position below the timeline
      .style("font-size", "1rem")
      .style("color", "#6D7084")
      .style("font-style", "italic");
    
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
        
        // Hide the guidance text on first scroll
        if (isFirstScroll) {
          d3.select(".scroll-guidance").classed("hidden", true);
        }
        
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
        
        // Update active step color based on gender distribution
        updateActiveStepColor(closestStep);
        
        if (window.updateEraProgress) {
          window.updateEraProgress(closestStep);
        }
        
        onStepChange(closestStep);
      }
    }

    // Helper function to update the color of the active step based on the dominant gender
    function updateActiveStepColor(year) {
      // Find the gender distribution data for this year from release_year.json
      // (This data should already be loaded by main.js)
      const yearData = window.releaseData?.find(d => d.year === year);
      
      if (!yearData) return; // No data for this year
      
      // Get counts for each gender
      const womenCount = yearData.women || 0;
      const menCount = yearData.men || 0;
      const unisexCount = yearData.unisex || 0;
      
      // Determine the dominant gender
      let dominantGender = 'women'; // default
      let maxCount = womenCount;
      
      if (menCount > maxCount) {
        dominantGender = 'men';
        maxCount = menCount;
      }
      
      if (unisexCount > maxCount) {
        dominantGender = 'unisex';
      }
      
      // Set color based on dominant gender - using same colors as the pie chart
      const genderColors = {
        women: "#E9D7E4",  // Light pink
        men: "#C4CDF4",   // Medium blue 
        unisex: "#6D7084" // Dark gray
      };
      
      // Get the active step
      const activeStep = d3.select(".step.is-active");
      
      // Apply color to ONLY the active step
      activeStep.style("background-color", genderColors[dominantGender]);
      
      // Set text color to white for unisex (dark background), default otherwise
      if (dominantGender === 'unisex') {
        activeStep.style("color", "#f8f8f8"); // Light text for dark background
      } else {
        activeStep.style("color", "#6D7084"); // Default text color
      }
      
      // Make sure other steps return to default styling when they're no longer active
      d3.selectAll(".step:not(.is-active)")
        .style("background-color", "")
        .style("color", "#6D7084");
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
      
      // Update active step color based on gender distribution
      updateActiveStepColor(year);
      
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
