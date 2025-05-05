export function renderNotesGraph(noteData, notesMap, noteTypeFilter = 'all', genderFilter = 'all', width = 150, height = 220) {
  // Skip if no data
  if (!noteData) return;
  
  const svg = d3.select("#notes-graph")
    .attr("width", width)
    .attr("height", height);
    
  // Initialize the grid if not already done
  if (!svg.select(".grid-container").size()) {
    initializeGrid(svg, width, height);
  }
  
  // Grid dimensions - keep consistent
  const cellSize = 10;
  const cols = Math.floor(width / cellSize);
  const rows = Math.floor(height / cellSize);
  const totalCells = cols * rows;
  
  // Process data - extract notes with their colors, applying filters
  let processedNotes = Object.entries(noteData)
    .map(([note, counts]) => {
      // Apply gender filter to total calculation
      let filteredTotal;
      if (genderFilter !== 'all') {
        filteredTotal = counts[genderFilter] || 0;
      } else {
        filteredTotal = counts.women + counts.men + counts.unisex;
      }
      
      return {
        note,
        total: filteredTotal,
        category: getCategory(note, notesMap),
        color: getColor(note, notesMap),
        noteTypes: counts.noteTypes || []
      };
    })
    .filter(d => {
      // Filter by note type
      if (noteTypeFilter !== 'all' && !d.noteTypes.includes(noteTypeFilter)) {
        return false;
      }
      
      // Filter by search term
      if (window.currentSearchTerm && !d.note.toLowerCase().includes(window.currentSearchTerm)) {
        return false;
      }
      
      // Filter out notes with no occurrence
      return d.total > 0;
    })
    .sort((a, b) => b.total - a.total);
    
  // Calculate total for percentage
  const grandTotal = processedNotes.reduce((sum, n) => sum + n.total, 0);
  
  // Create color mapping for existing grid cells
  const colorAssignments = createColorAssignments(processedNotes, grandTotal, totalCells);
  
  // Update existing grid cells with new colors
  updateGridColors(svg, colorAssignments, cols, rows, cellSize);
}

// Initialize static grid once
function initializeGrid(svg, width, height) {
  const cellSize = 10;
  const cols = Math.floor(width / cellSize);
  const rows = Math.floor(height / cellSize);
  
  // Create a container for all grid cells
  const gridContainer = svg.append("g")
    .attr("class", "grid-container");
    
  // Create a fixed grid structure
  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({ row, col, id: `cell-${row}-${col}` });
    }
  }
  
  // Create all grid cells up front
  gridContainer.selectAll(".grid-cell")
    .data(cells, d => d.id)
    .enter()
    .append("rect")
    .attr("class", "grid-cell")
    .attr("id", d => d.id)
    .attr("x", d => d.col * cellSize)
    .attr("y", d => d.row * cellSize)
    .attr("width", cellSize - 1)
    .attr("height", cellSize - 1)
    .attr("fill", "#eee") // Default color
    .attr("rx", 1) // Slightly rounded corners
    .on("mouseover", function(event, d) {
      // The d parameter now has the up-to-date note property
      if (d.note) {
        d3.select("#grid-tooltip")
          .style("display", "block")
          .style("left", (event.clientX + 10) + "px")
          .style("top", (event.clientY - 20) + "px")
          .html(d.note);
      }
      
      // Highlight this cell
      d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
    })
    .on("mouseout", function() {
      // Hide tooltip
      d3.select("#grid-tooltip").style("display", "none");
      
      // Remove highlight
      d3.select(this).attr("stroke", "none");
    });
}

// Create color assignments for the grid
function createColorAssignments(processedNotes, grandTotal, totalCells) {
  const assignments = [];
  let cellsAssigned = 0;
  
  processedNotes.forEach(note => {
    // Calculate how many cells this note should get
    const proportion = note.total / grandTotal;
    let cellCount = Math.max(1, Math.round(proportion * totalCells));
    
    // Don't overflow the grid
    if (cellsAssigned + cellCount > totalCells) {
      cellCount = totalCells - cellsAssigned;
    }
    
    // Add color assignment for this note
    for (let i = 0; i < cellCount; i++) {
      assignments.push({
        index: cellsAssigned + i,
        color: note.color,
        note: note.note,
        alpha: 0.7 + (Math.random() * 0.3)
      });
    }
    
    cellsAssigned += cellCount;
    if (cellsAssigned >= totalCells) return;
  });
  
  return assignments;
}

// Update colors of existing grid cells
function updateGridColors(svg, colorAssignments, cols, rows, cellSize) {
  const cells = svg.selectAll(".grid-cell");
  
  // Update each cell with its new color assignment
  cells.each(function(d, i) {
    const cell = d3.select(this);
    
    // Find color assignment for this cell index
    const assignment = colorAssignments.find(a => a.index === i);
    
    // If no assignment (rare case), use default color
    const color = assignment ? assignment.color : "#eee";
    const alpha = assignment ? assignment.alpha : 0.3;
    const noteName = assignment ? assignment.note : null;
    
    // Use datum() to properly update the data bound to this element
    cell.datum(Object.assign({}, d, { note: noteName }));
    
    // Transition the cell color
    cell
      .transition()
      .duration(750)
      .attr("fill", color)
      .attr("fill-opacity", alpha);
  });
}

// Keep your existing helper functions
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