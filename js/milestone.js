let milestones = [];

export function loadMilestones(data) {
  milestones = data;
}

export function updateMilestoneDisplay(year) {
  const box = d3.select("#milestone-box");
  const milestone = milestones.find(m => m.year === year);

  if (milestone) {
    console.log("Displaying milestone:", milestone.title);
    box.classed("hidden", false)
       .style("display", "block")
       .style("opacity", 1)
       .style("visibility", "visible");

    // Combine flag and title in one line
    d3.select("#milestone-title").text(`${milestone.country} ${milestone.title}`);
    d3.select("#milestone-subtitle").text(milestone.subtitle);
  } else {
    box.classed("hidden", true)
       .style("display", "none")
       .style("opacity", 0)
       .style("visibility", "hidden");
  }
}
