// Global variables for the chart
let expandedNote = null;
let width = 800; // This will be updated dynamically
let barHeight = 25;
let rowSpacing = 10;
let margin = { top: 10, right: 0, bottom: 0, left: 10 }; // Reduced left margin
let labelWidthBuffer = 220;
let genderColors = {
  women: "#E9D7E4",
  men: "#C4CDF4",
  unisex: "#6D7084"
};
let detailHeight = 220; // Height of the expanded detail view

export function resetExpandedNote() {
  expandedNote = null;
  d3.select(".note-detail-container").remove();
}

export function renderStackedBarChart(noteData, notesMap, noteTypeFilter = 'all', genderFilter = 'all') {
  const svg = d3.select("#stacked-bar-chart");
  
  // Add this check to prevent rendering when container is hidden
  const rightSection = document.querySelector('.right-section');
  if (rightSection.style.display === 'none' || !noteData) {
    return; // Exit early if the container is hidden
  }

  // Create defs element for gradients if it doesn't exist
  let defs = svg.select("defs");
  if (defs.empty()) {
    defs = svg.append("defs");
  } else {
    // Clear existing gradients to avoid duplicates
    defs.selectAll("linearGradient").remove();
  }

  // Get container width dynamically
  const containerWidth = d3.select(".right-column").node().getBoundingClientRect().width;
  width = containerWidth; // Use container width instead of fixed 800px

  // Process the data - First apply filters, then sort
  let dataArray = Object.entries(noteData)
    .map(([note, counts]) => ({
      note,
      ...counts,
      total: counts.women + counts.men + counts.unisex,
      category: getCategory(note, notesMap),
      color: getColor(note, notesMap)
    }))
    .filter(d => {
      if (d.total <= 0) return false;
    
      if (noteTypeFilter !== 'all' && !d.noteTypes?.includes(noteTypeFilter)) {
        return false;
      }
    
      if (window.currentSearchTerm && !d.note.toLowerCase().includes(window.currentSearchTerm)) {
        return false;
      }
    
      return true;
    })
    .sort((a, b) => {
      // This already works - it sorts by the gender filter value if set
      let aValue = a.total;
      let bValue = b.total;
      if (genderFilter !== 'all') {
        aValue = a[genderFilter] || 0;
        bValue = b[genderFilter] || 0;
      }
      return bValue - aValue;
    })
    .slice(0, 10); 

  // Find the index of the expanded note if it exists
  let expandedNoteIndex = -1;
  if (expandedNote) {
    expandedNoteIndex = dataArray.findIndex(d => d.note === expandedNote);
    if (expandedNoteIndex === -1) {
      expandedNote = null;
    }
  }

  // Calculate standard row height and total height
  const rowHeight = barHeight + rowSpacing;
  const baseChartHeight = dataArray.length * rowHeight;
  
  // Add additional height if a note is expanded
  const totalHeight = baseChartHeight + (expandedNote ? detailHeight : 0);
  
  svg.attr("width", width)
     .attr("height", totalHeight + margin.top + margin.bottom);
     
  // Add/update background rectangle to cover entire SVG
  let background = svg.select(".chart-background");
  if (background.empty()) {
    background = svg.insert("rect", ":first-child")
      .attr("class", "chart-background");
  }
  background
    .attr("width", width)
    .attr("height", totalHeight + margin.top + margin.bottom)
    .attr("fill", "#F8F8F8");

  // Create x scale
  const x = d3.scaleLinear()
    .domain([0, 1])
    .range([0, width - margin.left - margin.right - labelWidthBuffer]);

  // Setup container group
  let g = svg.select("g.chart-container");
  if (g.empty()) {
    g = svg.append("g")
      .attr("class", "chart-container")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
  }

  // Remove any existing detail container
  g.select(".note-detail-container").remove();

  // Create custom positioning function for rows
  function getYPosition(d, i) {
    // Standard position based on index
    let yPos = i * rowHeight;
    
    // If there's an expanded note and this row is after it, add detail height
    if (expandedNote && expandedNoteIndex >= 0 && i > expandedNoteIndex) {
      yPos += detailHeight;
    }
    
    return yPos;
  }

  // RENDER BAR GROUPS
  const barGroups = g.selectAll(".bar-group")
    .data(dataArray, d => d.note);

  // Enter new bar groups
  const enterGroups = barGroups.enter()
    .append("g")
    .attr("class", "bar-group")
    .attr("transform", (d, i) => `translate(${labelWidthBuffer}, ${getYPosition(d, i) + barHeight / 2})`);
  
  // Create bar segments for each gender
  enterGroups.each(function(d) {
    const g = d3.select(this);
    const total = d.total;
    let xOffset = 0;
    const segmentPadding = 2; // Add padding between segments

    // Women segment
    g.append("rect")
      .attr("class", "women-segment")
      .attr("x", xOffset)
      .attr("y", -barHeight / 2)
      .attr("width", Math.max(0, x(d.women / total) - segmentPadding)) // Subtract padding
      .attr("height", barHeight)
      .attr("fill", genderColors.women)
      .on("mouseover", function(event) {
        d3.select("#bar-chart-tooltip")
          .style("display", "block")
          .style("left", (event.clientX + 12) + "px") 
          .style("top", (event.clientY - 20) + "px")  
          .html(`Women: ${(d.women / total * 100).toFixed(1)}%`);
      })
      .on("mousemove", function(event) {
        d3.select("#bar-chart-tooltip")
          .style("left", (event.clientX + 12) + "px") 
          .style("top", (event.clientY - 20) + "px"); 
      })
      .on("mouseout", function() {
        d3.select("#bar-chart-tooltip").style("display", "none");
      });

    xOffset += x(d.women / total); // Keep the full width for positioning

    // Unisex segment
    g.append("rect")
      .attr("class", "unisex-segment")
      .attr("x", xOffset + segmentPadding/2) // Add half padding to left
      .attr("y", -barHeight / 2)
      .attr("width", Math.max(0, x(d.unisex / total) - segmentPadding)) // Subtract padding
      .attr("height", barHeight)
      .attr("fill", genderColors.unisex)
      .on("mouseover", function(event) {
        d3.select("#bar-chart-tooltip")
          .style("display", "block")
          .style("left", (event.clientX + 12) + "px") 
          .style("top", (event.clientY - 20) + "px")  
          .html(`Unisex: ${(d.unisex / total * 100).toFixed(1)}%`);
      })
      .on("mousemove", function(event) {
        d3.select("#bar-chart-tooltip")
          .style("left", (event.clientX + 12) + "px") 
          .style("top", (event.clientY - 20) + "px"); 
      })
      .on("mouseout", function() {
        d3.select("#bar-chart-tooltip").style("display", "none");
      });

    xOffset += x(d.unisex / total); // Keep the full width for positioning

    // Men segment
    g.append("rect")
      .attr("class", "men-segment")
      .attr("x", xOffset + segmentPadding/2) // Add half padding to left
      .attr("y", -barHeight / 2)
      .attr("width", Math.max(0, x(d.men / total) - segmentPadding/2)) // Subtract half padding (end of bar)
      .attr("height", barHeight)
      .attr("fill", genderColors.men)
      .on("mouseover", function(event) {
        d3.select("#bar-chart-tooltip")
          .style("display", "block")
          .style("left", (event.clientX + 12) + "px") 
          .style("top", (event.clientY - 20) + "px")  
          .html(`Men: ${(d.men / total * 100).toFixed(1)}%`);
      })
      .on("mousemove", function(event) {
        d3.select("#bar-chart-tooltip")
          .style("left", (event.clientX + 12) + "px") 
          .style("top", (event.clientY - 20) + "px"); 
      })
      .on("mouseout", function() {
        d3.select("#bar-chart-tooltip").style("display", "none");
      });
  });

  // Update existing bar groups
  barGroups.transition().duration(300)
    .attr("transform", (d, i) => `translate(${labelWidthBuffer}, ${getYPosition(d, i) + barHeight / 2})`);

  // Update widths of existing segments
  barGroups.each(function(d) {
    const group = d3.select(this);
    const total = d.total;
    const segmentPadding = 2; // Same padding value
    
    // Update women segment
    group.select(".women-segment")
      .transition()
      .duration(300)
      .attr("width", Math.max(0, x(d.women / total) - segmentPadding));
    
    // Update unisex segment
    group.select(".unisex-segment")
      .transition()
      .duration(300)
      .attr("width", Math.max(0, x(d.unisex / total) - segmentPadding))
      .attr("x", x(d.women / total) + segmentPadding/2);
    
    // Update men segment
    group.select(".men-segment")
      .transition()
      .duration(300)
      .attr("width", Math.max(0, x(d.men / total) - segmentPadding/2))
      .attr("x", x((d.women + d.unisex) / total) + segmentPadding/2);
  });

  // Remove exiting bar groups
  barGroups.exit().remove();

  // RENDER NOTE LABELS
  const labelGroups = g.selectAll(".note-label")
    .data(dataArray, d => d.note);

  // For NEW labels, use 0 to align properly
  const labelEnter = labelGroups.enter()
    .append("g")
    .attr("class", "note-label")
    .attr("transform", (d, i) => `translate(${margin.left}, ${getYPosition(d, i) + barHeight / 2})`)
    .style("cursor", "pointer");

  // Create pill background, image, and text
  labelEnter.each(function(d) {
    const g = d3.select(this);
    const paddingLeft = 35; // Increased to make room for image when shown
    const fixedWidth = 200;
    const arrowSize = 12;    
    const pillHeight = barHeight;
    const imageSize = 25;

    // Create a linear gradient definition for this note
    const gradientId = `note-gradient-${d.note.replace(/\s+/g, '-').toLowerCase()}`;
    const gradient = g.append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "40%") // Gradient covers 40% of the left section
      .attr("y2", "0%");

    // Define gradient stops - same color but different opacity
    const baseColor = d.color;
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", baseColor)
      .attr("stop-opacity", 0); // Change from 0.5 to 0 for starting opacity

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", baseColor)
      .attr("stop-opacity", 1); // End with 100% opacity
    
    // Create the arrow shape first (background)
    g.append("path")
      .attr("d", perfumeTesterPath(fixedWidth, pillHeight, arrowSize))
      .attr("fill", `url(#${gradientId})`) // Use the gradient instead of solid color
      .attr("transform", `translate(0, ${-pillHeight / 2})`);
    
    // Add note image but make it invisible by default
    const noteImage = g.append("image")
      .attr("class", "note-image")
      .attr("xlink:href", `data/notes_images/${d.note.toLowerCase()}.jpg`)
      .attr("x", 0) 
      .attr("y", -imageSize/2)
      .attr("width", imageSize)
      .attr("height", imageSize)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("opacity", 0) // Start hidden
      .on("error", function() {
        // Handle missing images gracefully
        d3.select(this).style("display", "none");
      });

    // Create text after image (with increased padding)
    const text = g.append("text")
      .attr("x", paddingLeft)
      .attr("y", 0)
      .attr("alignment-baseline", "middle")
      .attr("font-family", "Instrument Sans, sans-serif")
      .attr("font-size", "0.7rem")
      .attr("fill", "#6D7084")
      .text(toTitleCase(d.note)); 

    // Calculate text width to ensure text fits
    const textWidth = text.node().getComputedTextLength();
    
    // If text is too long, truncate with ellipsis
    if (textWidth > fixedWidth - paddingLeft - arrowSize - 5) {
      let truncatedText = toTitleCase(d.note); // Change to title case instead of uppercase
      while (text.node().getComputedTextLength() > fixedWidth - paddingLeft - arrowSize - 15) {
        truncatedText = truncatedText.slice(0, -1);
        text.text(truncatedText + '...');
      }
    }

    // Add hover handlers to show/hide image
    g.on("mouseenter", function() {
      noteImage.transition()
        .duration(200)
        .style("opacity", 1);
    })
    .on("mouseleave", function() {
      noteImage.transition()
        .duration(200)
        .style("opacity", 0);
    });
  });

  // For UPDATES, maintain proper x position using margin.left
  labelGroups.transition().duration(300)
    .attr("transform", (d, i) => `translate(${margin.left}, ${getYPosition(d, i) + barHeight / 2})`);
    
  // Update indicators
  labelGroups.each(function(d) {
    const g = d3.select(this);
    g.select(".indicator").remove();
    
    if (d.note === expandedNote) {
      const text = g.select("text");
      const paddingLeft = 10;
      const paddingRight = 20;
      const textWidth = text.node().getComputedTextLength();
      const pillWidth = textWidth + paddingLeft + paddingRight;
    
    }
  });

  // Remove exiting labels
  labelGroups.exit().remove();

  // ADD CLICK HANDLERS TO ALL LABELS
  g.selectAll(".note-label").each(function(d) {
    const label = d3.select(this);
    
    // Remove existing click listener
    label.on("click", null);
    
    // Add new click listener
    label.on("click", function() {
      if (expandedNote === d.note) {
        // Close the current one
        expandedNote = null;
      } else {
        // Open this one
        expandedNote = d.note;
      }
      
      // Re-render the chart with updated layout
      renderStackedBarChart(noteData, notesMap, noteTypeFilter, genderFilter);
    });
  });

  // Render detail view for expanded note if needed
  if (expandedNote && expandedNoteIndex >= 0) {
    // Calculate position - directly after the expanded note's row
    const detailY = getYPosition(dataArray[expandedNoteIndex], expandedNoteIndex) + rowHeight;
    renderNoteDetailView(expandedNote, g, dataArray, detailY);
  }
}

function perfumeTesterPath(width, height, arrowSize) {
  // Creates a rectangle with pointed arrow on right side
  return `
    M0,0
    h${width - arrowSize}
    l${arrowSize},${height / 2}
    l-${arrowSize},${height / 2}
    h-${width - arrowSize}
    Z
  `;
}

function getCategory(note, notesMap) {
  if (!notesMap || !notesMap.categories) return "Others";
  for (const [category, data] of Object.entries(notesMap.categories)) {
    if (data.notes && data.notes.includes(note)) return category;
  }
  return "Others";
}

function getColor(note, notesMap) {
  const category = getCategory(note, notesMap);
  return notesMap?.categories[category]?.color || "#ccc";
}

function renderNoteDetailView(noteName, parentElement, dataArray, yPosition) {
  // Get trend data for this note
  const trendData = window.allNoteTrends ? window.allNoteTrends[noteName] : [];
  if (!trendData || trendData.length === 0) return;
  
  // Filter to 1990-2024 period
  const filteredTrendData = trendData.filter(d => d.year >= 1990 && d.year <= 2024);
  
  // Create container
  const detailContainer = parentElement.append("g")
    .attr("class", "note-detail-container")
    .attr("transform", `translate(0, ${yPosition})`);
  
  // Add background
  const detailWidth = width - margin.left - margin.right;
  detailContainer.append("rect")
    .attr("width", detailWidth)
    .attr("height", detailHeight)
    .attr("fill", "#f8f8f8")
    .attr("rx", 5);
  
  // Setup chart dimensions
  const chartMargin = {top: 20, right: 20, bottom: 30, left: 40};
  const chartWidth = detailWidth - chartMargin.left - chartMargin.right;
  const chartHeight = 120;
  
  // Create chart group
  const chartGroup = detailContainer.append("g")
    .attr("transform", `translate(${chartMargin.left}, ${chartMargin.top})`);
  
  // Create scales
  const xScale = d3.scaleLinear()
    .domain([1990, 2024])
    .range([0, chartWidth]);
  
  const maxCount = d3.max(filteredTrendData, d => Math.max(d.women || 0, d.men || 0, d.unisex || 0)) || 0;
  
  const yDomainMax = Math.ceil(maxCount * 1.1 / 10) * 10;
  const yTicks = [0, yDomainMax / 2, yDomainMax]; // 3 clean ticks

  const yDetailScale = d3.scaleLinear()
    .domain([0, yDomainMax])
    .range([chartHeight, 0]);

  // Add gridlines
  chartGroup.append("g")
    .attr("class", "grid-lines")
    .selectAll("line.grid-line")
    .data(yTicks)
    .enter()
    .append("line")
    .attr("class", "grid-line")
    .attr("x1", 0)
    .attr("x2", chartWidth)
    .attr("y1", d => yDetailScale(d))
    .attr("y2", d => yDetailScale(d))
    .attr("stroke", "#ddd")
    .attr("stroke-dasharray", "2,2");
  
  // Add y-axis labels
  chartGroup.append("g")
    .attr("class", "y-axis-labels")
    .selectAll("text.y-label")
    .data(yTicks)
    .enter()
    .append("text")
    .attr("class", "y-label")
    .attr("x", -5)
    .attr("y", d => yDetailScale(d) + 3) // nudge down to stay inside white box
    .attr("text-anchor", "end")
    .attr("alignment-baseline", "middle")
    .text(d => Math.round(d));
  
  // Add x-axis decades
  chartGroup.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${chartHeight})`)
    .selectAll("text.x-label")
    .data([1990, 2000, 2010, 2020])
    .enter()
    .append("text")
    .attr("class", "x-label")
    .attr("x", d => xScale(d))
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .text(d => d);
  
  // Create line generators
  const createLine = (accessor) => d3.line()
    .x(d => xScale(d.year))
    .y(d => yDetailScale(accessor(d) || 0))
    .curve(d3.curveCatmullRom);
  
  const womenLine = createLine(d => d.women);
  const menLine = createLine(d => d.men);
  const unisexLine = createLine(d => d.unisex);
  
  // Add the lines with tooltip functionality
  chartGroup.append("path")
    .datum(filteredTrendData)
    .attr("fill", "none")
    .attr("stroke", genderColors.women)
    .attr("stroke-width", 2)
    .attr("d", womenLine);
  
  chartGroup.append("path")
    .datum(filteredTrendData)
    .attr("fill", "none")
    .attr("stroke", genderColors.men)
    .attr("stroke-width", 2)
    .attr("d", menLine);
  
  chartGroup.append("path")
    .datum(filteredTrendData)
    .attr("fill", "none")
    .attr("stroke", genderColors.unisex)
    .attr("stroke-width", 2)
    .attr("d", unisexLine);
    
  // Add hover overlay for tooltip interaction
  const tooltip = d3.select("#bar-chart-tooltip");
  
  // Create a bisector for finding closest data point
  const bisect = d3.bisector(d => d.year).left;
  
  // Add invisible overlay for mouse tracking
  chartGroup.append("rect")
    .attr("class", "overlay")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("mouseover", function() {
      tooltip.style("display", "block");
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
    })
    .on("mousemove", function(event) {
      // Get mouse position relative to chart
      const [mouseX] = d3.pointer(event, this);
      
      // Convert x position to year value
      const year = xScale.invert(mouseX);
      
      // Find closest data point
      const index = bisect(filteredTrendData, year);
      const dataPoint = filteredTrendData[Math.min(index, filteredTrendData.length - 1)];
      
      // Only show tooltip if we have data
      if (!dataPoint) return;
      
      // Find which point is closest to mouse vertically
      const mouseY = d3.pointer(event, this)[1];
      const womenY = yDetailScale(dataPoint.women || 0);
      const menY = yDetailScale(dataPoint.men || 0);
      const unisexY = yDetailScale(dataPoint.unisex || 0);
      
      const distances = [
        { gender: "Women", value: dataPoint.women || 0, dist: Math.abs(mouseY - womenY) },
        { gender: "Men", value: dataPoint.men || 0, dist: Math.abs(mouseY - menY) },
        { gender: "Unisex", value: dataPoint.unisex || 0, dist: Math.abs(mouseY - unisexY) }
      ];
      
      // Sort by distance (closest first)
      distances.sort((a, b) => a.dist - b.dist);
      
      // Draw focus circle on closest line
      // Add tooltip content
      tooltip
        .style("left", (event.clientX + 12) + "px")
        .style("top", (event.clientY - 20) + "px")
        .html(`
          <strong>${distances[0].gender}</strong><br>
          Year: ${dataPoint.year}<br>
          Count: ${distances[0].value}
        `);
        
      // Update position indicator
      updatePositionIndicator(chartGroup, dataPoint, distances[0].gender.toLowerCase());
    });
    
  // Create position indicator elements
  const positionIndicator = chartGroup.append("g")
    .attr("class", "position-indicator")
    .style("display", "none");
    
  positionIndicator.append("circle")
    .attr("r", 4)
    .attr("fill", "white")
    .attr("stroke", "#333")
    .attr("stroke-width", 2);
    
  function updatePositionIndicator(chartGroup, dataPoint, gender) {
    const positionIndicator = chartGroup.select(".position-indicator");
    positionIndicator.style("display", "block");
    
    // Set the indicator color based on gender
    const color = genderColors[gender];
    positionIndicator.select("circle").attr("stroke", color);
    
    // Position the indicator at the data point
    const x = xScale(dataPoint.year);
    const y = yDetailScale(dataPoint[gender] || 0);
    positionIndicator.attr("transform", `translate(${x}, ${y})`);
  }
  
  // Hide the indicator when mouse leaves
  chartGroup.select(".overlay").on("mouseout", function() {
    chartGroup.select(".position-indicator").style("display", "none");
  });
  
  // Add commonly paired notes section
  const pairedNotes = window.fragranceData ? 
    getCoOccurringNotes(window.fragranceData, noteName) : [];
  
  // Add commonly paired notes label
  const pillRowY = chartHeight + chartMargin.top + chartMargin.bottom + 22;
  detailContainer.append("text")
    .attr("x", 15)
    .attr("y", pillRowY)
    .attr("alignment-baseline", "middle")
    .attr("font-family", "Instrument Sans, sans-serif")
    .attr("fill", "#6D7084")
    .attr("font-size", "11px")
    .text("COMMONLY PAIRED WITH:");
  

  // Add paired note pills
  let xOffset = 180;
  pairedNotes.forEach((note, i) => {
    // Position at the exact same Y as the label for alignment
    const pillGroup = detailContainer.append("g")
      .attr("transform", `translate(${xOffset}, ${pillRowY})`);

    const paddingX = 15;
    const pillHeight = 20;
    const arrowSize = 8;
    
    // Create gradient for paired note
    const baseColor = getColor(note, window.notesMap) || "#ccc";
    const detailGradientId = `paired-note-gradient-${i}-${note.replace(/\s+/g, '-').toLowerCase()}`;
    
    // Add gradient to the main SVG defs
    const svg = d3.select("#stacked-bar-chart");
    const defs = svg.select("defs");
    
    const gradient = defs.append("linearGradient")
      .attr("id", detailGradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "40%")
      .attr("y2", "0%");
      
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", baseColor)
      .attr("stop-opacity", 0); // Start with 0% opacity
      
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", baseColor)
      .attr("stop-opacity", 1);
    
    // First add text to measure its width
    const pillText = pillGroup.append("text")
      .attr("x", paddingX)
      .attr("y", 0) // Center at Y=0 (we're already at pillRowY from the transform)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "11px")
      .attr("font-family", "Instrument Sans, sans-serif")
      .attr("fill", "#6D7084")
      .text(function(d) { 
        return toTitleCase(note); 
      });

    // Calculate dynamic width based on text content
    const textWidth = pillText.node().getComputedTextLength();
    const pillWidth = textWidth + (paddingX * 2) + arrowSize;
    
    // Now create the arrow shape background with the correct width
    pillGroup.insert("path", "text")
      .attr("d", perfumeTesterPath(pillWidth, pillHeight, arrowSize))
      .attr("fill", `url(#${detailGradientId})`)
      .attr("transform", `translate(0, ${-pillHeight / 2})`);
    
    // Update xOffset for next pill based on this pill's width
    xOffset += pillWidth + 8;
  });
}

// Helper function - import was failing so redefined here
function getCoOccurringNotes(fragrances, selectedNote) {
  const coNoteCounts = {};

  fragrances.forEach(f => {
    const notes = [...(f.Top || []), ...(f.Middle || []), ...(f.Base || [])];

    if (notes.includes(selectedNote)) {
      notes.forEach(note => {
        if (note !== selectedNote) {
          coNoteCounts[note] = (coNoteCounts[note] || 0) + 1;
        }
      });
    }
  });

  // Return top 5 most commonly paired notes
  return Object.entries(coNoteCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([note]) => note);
}

// Helper function to convert string to Title Case
function toTitleCase(str) {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}