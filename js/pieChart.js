export function renderPieChart({ women = 0, men = 0, unisex = 0 }) {
  const data = [
    { label: "Women", value: women, color: "#DCDFED" },
    { label: "Men", value: men, color: "#C4CDF4" },
    { label: "Unisex", value: unisex, color: "#C181B2" }
  ];

  // Filter out zero values to handle edge cases
  const filteredData = data.filter(d => d.value > 0);
  
  const width = 100;
  const height = 100;
  const radius = Math.min(width, height) / 2;

  const svg = d3.select("#pie-chart")
    .attr("width", width)
    .attr("height", height);

  const g = svg.selectAll(".pie-container").data([null]);
  const gEnter = g.enter().append("g").attr("class", "pie-container");
  const gMerged = gEnter.merge(g)
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const pie = d3.pie()
    .value(d => d.value)
    .sort(null) // Preserve segment order
    .padAngle(0.02); // Add padding between segments

  const arc = d3.arc()
    .innerRadius(radius * 0.5) // doughnut
    .outerRadius(radius)
    .cornerRadius(1); // Slightly round the corners where segments meet

  const tooltip = d3.select("#pie-chart-tooltip");

  // Create a key function for data binding that ensures continuity
  const arcKeyFn = d => d.data.label;

  // Join the pie data to path elements
  const path = gMerged.selectAll("path")
    .data(pie(filteredData), arcKeyFn);

  // Handle exiting elements with a transition
  path.exit()
    .transition()
    .duration(500)
    .attrTween("d", exitArcTween)
    .remove();

  // Add new segments
  const pathEnter = path.enter().append("path")
    .attr("fill", d => d.data.color)
    .attr("opacity", 0.9)
    .each(function(d) {
      this._current = { 
        startAngle: d.startAngle, 
        endAngle: d.startAngle, // Start from 0 width
        data: d.data 
      };
    });

  // Update segments with transition
  pathEnter.merge(path)
    .on("mouseover", function(event, d) {
      const total = filteredData.reduce((sum, d) => sum + d.value, 0);
      const percent = ((d.data.value / total) * 100).toFixed(1);
      
      tooltip
        .style("display", "block")
        .html(`${d.data.label}: ${d.data.value} (${percent}%)`);
        
      d3.select(this)
        .transition()
        .duration(100)
        .attr("opacity", 1);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.clientX + 12) + "px")
        .style("top", (event.clientY - 20) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
      d3.select(this)
        .transition()
        .duration(100)
        .attr("opacity", 0.9);
    })
    .transition()
    .duration(750)
    .attrTween("d", arcTween);

  // Arc animation functions
  function arcTween(d) {
    const i = d3.interpolate(this._current || { startAngle: 0, endAngle: 0 }, d);
    this._current = i(0);
    return function(t) {
      return arc(i(t));
    };
  }
  
  function exitArcTween(d) {
    const i = d3.interpolate(this._current, { 
      startAngle: this._current.endAngle, 
      endAngle: this._current.endAngle 
    });
    return function(t) {
      return arc(i(t));
    };
  }
}
