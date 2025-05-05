export function updateEraDisplay(year, summaryData) {
  // Find the era that contains this year
  const era = getEraForYear(year, summaryData);
  
  if (!era) return; // No matching era found
  
  // Update the era display elements
  const eraContainer = d3.select("#era-display");
  
  eraContainer.select(".era-title")
    .text(era.era);
    
  eraContainer.select(".era-years")
    .text(`${era.start_year} - ${era.end_year}`);
    
  eraContainer.select(".era-gender-approach")
    .text(era.gender_approach);
    
  eraContainer.select(".era-description")
    .text(era.description);
}

function getEraForYear(year, summaryData) {
  return summaryData.find(era => 
    year >= era.start_year && year <= era.end_year
  );
}