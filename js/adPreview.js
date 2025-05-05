// adPreview.js

let adData = [];

export function loadAdData(data) {
  adData = data;
}

export function updateAdPreview(year) {
  const containerId = "ad-preview-container";
  const previewId = "ad-preview-box";
  let container = d3.select(`#${containerId}`);
  let previewBox = d3.select(`#${previewId}`);

  if (container.empty() || previewBox.empty()) return;

  let adsThisYear = adData.filter(d => d.year === year);
  adsThisYear = adsThisYear.slice(0, 20); 
  container.classed("hidden", adsThisYear.length === 0);
  previewBox.classed("hidden", true);

  const adCircles = container.selectAll(".ad-thumb-wrapper")
    .data(adsThisYear, d => d["ad-image"]);

  adCircles.exit().remove();

  const enterWrapper = adCircles.enter()
    .append("div")
    .attr("class", "ad-thumb-wrapper");

  enterWrapper.append("img")
    .attr("class", "ad-thumb")
    .attr("src", d => `ad/${d["ad-image"]}`)
    .on("mouseover", function (event, d) {
      d3.select("#ad-preview-img")
        .attr("src", `ad/${d["ad-image"]}`);

      d3.select("#ad-preview-text")
        .text(`${capitalize(d.brand)} for ${capitalize(d.gender)}`);

      previewBox.classed("hidden", false);
    })
    .on("mouseout", function () {
      previewBox.classed("hidden", true);
    });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
