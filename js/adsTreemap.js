// Add import for gallery functions at the top of the file
import { initializeGallery, updateGallery } from './adsGallery.js';

// Define consistent color palette
const genderColors = {
  women: "#DCDFED",
  men: "#C4CDF4",
  unisex: "#C181B2",
  unclear: "#C181B2"
};

// Store navigation history for each treemap
const navHistory = {
  women: [],
  men: [],
  unisex: []
};

// Global variables to store data
let adsData = [];
let currentEraData = {
  start_year: 1900,
  end_year: 1939,
  era: "Idealized Femininity"
};

// Add this variable to track the current era ID to avoid unnecessary updates
let currentEraId = null;

// Function to load ad data
function loadAdsData() {
  console.log("Loading ad data from ad/ad_analysis.json");
  return fetch('ad/ad_analysis.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      adsData = data;
      console.log(`Successfully loaded ${adsData.length} ads`);
      return adsData;
    })
    .catch(error => {
      console.error("Error loading ad data:", error);
      return [];
    });
}

// Function to filter ads by era
function filterAdsByEra(era) {
  return adsData.filter(ad => ad.year >= era.start_year && ad.year <= era.end_year);
}

// Function to create all three treemaps for the current era
function createTreemaps(era) {
  currentEraData = era;
  
  // Debug output
  console.log("Creating treemaps for era:", era);
  
  // Filter ads for current era
  const eraAds = filterAdsByEra(era);
  console.log(`Found ${eraAds.length} ads for this era`);
  
  // Count character categories for each gender
  const genderCounts = {
    women: { women_only: 0, men_only: 0, both: 0, unclear_gender: 0, none: 0, total: 0 },
    men: { women_only: 0, men_only: 0, both: 0, unclear_gender: 0, none: 0, total: 0 },
    unisex: { women_only: 0, men_only: 0, both: 0, unclear_gender: 0, none: 0, total: 0 }
  };
  
  // Calculate statistics for each gender
  eraAds.forEach(ad => {
    const targetGender = ad.gender.toLowerCase();
    if (!genderCounts[targetGender]) return;
    
    genderCounts[targetGender].total++;
    
    // If ad has vision analysis, categorize by character content
    if (ad.analysis?.vision?.people) {
      const hasWomen = ad.analysis.vision.people.some(p => p.gender === "woman");
      const hasMen = ad.analysis.vision.people.some(p => p.gender === "man");
      const hasUnclearGender = ad.analysis.vision.people.some(p => 
        p.gender === "unclear" || !["woman", "man"].includes(p.gender));
      
      if (hasWomen && hasMen) {
        genderCounts[targetGender].both++;
      } else if (hasWomen) {
        genderCounts[targetGender].women_only++;
      } else if (hasMen) {
        genderCounts[targetGender].men_only++;
      } else if (hasUnclearGender) {
        genderCounts[targetGender].unclear_gender++;
      } else {
        genderCounts[targetGender].none++;
      }
    } else {
      genderCounts[targetGender].none++;
    }
  });
  
  // Create treemaps for each gender
  ["women", "men", "unisex"].forEach(gender => {
    // Skip if no data for this gender
    if (!genderCounts[gender] || genderCounts[gender].total === 0) {
      document.querySelector(`.treemap-wrapper[data-gender="${gender}"]`).style.display = "none";
      return;
    }
    
    // Show the treemap wrapper
    document.querySelector(`.treemap-wrapper[data-gender="${gender}"]`).style.display = "block";
    
    // Update title with count
    const titleElement = document.querySelector(`.treemap-wrapper[data-gender="${gender}"] .treemap-title`);
    titleElement.textContent = `Ads Targeting ${capitalizeFirstLetter(gender)} (${genderCounts[gender].total})`;
    
    // Create character data for treemap
    const characterData = {
      name: "root",
      children: [
        {
          name: "Women Only",
          value: genderCounts[gender].women_only,
          color: genderColors.women,
          type: "women_only"
        },
        {
          name: "Men Only",
          value: genderCounts[gender].men_only,
          color: genderColors.men,
          type: "men_only"
        },
        {
          name: "Both",
          value: genderCounts[gender].both,
          color: "#AEA9BC",
          type: "both"
        },
        {
          name: "Unclear Gender",
          value: genderCounts[gender].unclear_gender,
          color: genderColors.unisex,
          type: "unclear_gender"
        },
        {
          name: "No People",
          value: genderCounts[gender].none,
          color: "#DEDEDE",
          type: "none"
        }
      ].filter(d => d.value > 0) // Remove categories with zero counts
    };
    
    // Reset navigation history
    navHistory[gender] = [];
    
    // Get the SVG element
    const svg = document.getElementById(`treemap-${gender}`);
    
    // Store data for navigation
    svg.characterData = characterData;
    
    // Set up back button handler
    setupBackButton(gender);
    
    // Render initial treemap
    renderTreemap(svg, characterData, gender, null);
  });
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Set up back button functionality
function setupBackButton(gender) {
  const backButton = document.getElementById(`back-button-${gender}`);
  const breadcrumb = document.getElementById(`breadcrumb-${gender}`);
  const svg = document.getElementById(`treemap-${gender}`);
  
  backButton.addEventListener('click', function() {
    if (navHistory[gender].length > 0) {
      // Go back to previous state
      const prevState = navHistory[gender].pop();
      renderTreemap(svg, prevState.data, gender, prevState.parentType);
      breadcrumb.textContent = prevState.breadcrumbText || 'Visual Subject';
      
      // Hide back button if at root
      if (navHistory[gender].length === 0) {
        backButton.style.display = 'none';
        
        // When returning to the root view, update gallery to show all ads for this gender
        updateGallery(gender, null);
      } else {
        // Otherwise, update gallery to match the previous state
        const parentType = prevState.parentType;
        updateGallery(gender, parentType);
      }
    } else {
      // Fallback to initial view
      renderTreemap(svg, svg.characterData, gender, null);
      breadcrumb.textContent = 'Visual Subject';
      backButton.style.display = 'none';
      
      // Update gallery to show all ads for this gender
      updateGallery(gender, null);
    }
  });
}

// Update renderTreemap function to handle the modified "both" structure

function renderTreemap(svg, data, gender, parentType) {
  // Clear existing content
  svg.innerHTML = '';
  
  const width = svg.clientWidth;
  const height = svg.clientHeight;
  const margin = { top: 5, right: 5, bottom: 5, left: 5 };
  
  // Generate treemap layout
  const treemap = d3.treemap()
    .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
    .paddingOuter(3)
    .paddingInner(1)
    .round(true);
  
  // Create root hierarchy
  const root = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);
  
  // Apply treemap layout
  treemap(root);
  
  // Create D3 selection for SVG
  const svgSelection = d3.select(svg);
  
  // Add group for treemap cells
  const group = svgSelection.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Create cells
  const cell = group.selectAll("g")
    .data(root.descendants().filter(d => d.depth > 0))
    .enter().append("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);
  
  // Add cell rectangles with tooltip attributes
  cell.append("rect")
    .attr("width", d => Math.max(0, d.x1 - d.x0))
    .attr("height", d => Math.max(0, d.y1 - d.y0))
    .attr("fill", d => d.data.color)
    .attr("stroke", "#fff")
    .attr("stroke-width", d => d.data.type === "women_section" || d.data.type === "men_section" ? 2 : 1)
    .style("cursor", "pointer")
    .on("click", (event, d) => handleTreemapClick(d, gender, parentType, svg))
    .on("mouseover", function(event, d) {
      // Calculate percentage based on parent
      let total;
      
      if (parentType === "both") {
        if (d.data.type === "woman_emotion") {
          total = d.parent.children
            .filter(node => node.data.type === "woman_emotion")
            .reduce((sum, node) => sum + node.value, 0);
        } else if (d.data.type === "man_emotion") {
          total = d.parent.children
            .filter(node => node.data.type === "man_emotion")
            .reduce((sum, node) => sum + node.value, 0);
        } else {
          total = d.parent.value;
        }
      } else {
        total = d.parent.value;
      }
      
      const percent = (d.value / total * 100).toFixed(0);
      
      // Get cell dimensions to determine if text will fit
      const cellWidth = d.x1 - d.x0;
      const cellHeight = d.y1 - d.y0;
      const minWidth = 60; // Minimum width to show tooltip
      const minHeight = 40; // Minimum height to show tooltip
      
      // Only show tooltip for small cells where text isn't already visible
      if (cellWidth < minWidth || cellHeight < minHeight) {
        // Show tooltip that follows the mouse
        d3.select("#treemap-tooltip")
          .style("display", "block")
          .style("left", (event.clientX + 12) + "px")
          .style("top", (event.clientY - 20) + "px")
          .html(`${d.data.name}: ${percent}%`);
      }
      
      // Optional highlight for all cells regardless of tooltip visibility
      d3.select(this).attr("stroke-width", 2);
    })
    .on("mousemove", function(event) {
      // Only move the tooltip if it's already being displayed
      if (d3.select("#treemap-tooltip").style("display") === "block") {
        // Update tooltip position as mouse moves
        d3.select("#treemap-tooltip")
          .style("left", (event.clientX + 12) + "px")
          .style("top", (event.clientY - 20) + "px");
      }
    })
    .on("mouseout", function() {
      // Hide tooltip
      d3.select("#treemap-tooltip").style("display", "none");
      
      // Remove highlight
      d3.select(this).attr("stroke-width", 1);
    });

  // Create a group for cell content
  const cellContent = cell.append("g")
    .style("pointer-events", "none");

  // Add text to cells only if they're big enough
  cellContent.each(function(d) {
    const cellWidth = d.x1 - d.x0;
    const cellHeight = d.y1 - d.y0;
    const minWidth = 60; // Minimum width to show text
    const minHeight = 40; // Minimum height to show text
    
    // Only add text if cell is big enough
    if (cellWidth >= minWidth && cellHeight >= minHeight) {
      // Main cell text (name)
      d3.select(this).append("text")
        .attr("x", cellWidth / 2)
        .attr("y", cellHeight / 2 - 10) // Increase padding by moving text up
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", getBrightness(d3.color(d.data.color)) < 128 ? "#fff" : "#000")
        .attr("font-size", "0.8rem")
        .attr("font-family", "instrument-sans-variable, sans-serif")
        .text(d.data.name);
      
      // Percentage text (smaller) - increased spacing from title
      d3.select(this).append("text")
        .attr("x", cellWidth / 2)
        .attr("y", cellHeight / 2 + 12) // Increase padding by moving percentage down
        .attr("text-anchor", "middle")
        .attr("fill", getBrightness(d3.color(d.data.color)) < 128 ? "#fff" : "#000")
        .attr("font-size", "0.6rem")
        .attr("font-family", "instrument-sans-variable, sans-serif")
        .text(() => {
          let total;
          
          if (parentType === "both") {
            // For emotions in the "both" category, calculate percentage based on gender
            if (d.data.type === "woman_emotion") {
              total = d.parent.children
                .filter(node => node.data.type === "woman_emotion")
                .reduce((sum, node) => sum + node.value, 0);
            } else if (d.data.type === "man_emotion") {
              total = d.parent.children
                .filter(node => node.data.type === "man_emotion")
                .reduce((sum, node) => sum + node.value, 0);
            } else {
              total = d.parent.value;
            }
          } else {
            total = d.parent.value;
          }
          
          const percent = (d.value / total * 100).toFixed(0);
          return `${percent}%`;
        });
    }
  });
}

// Helper function to determine text color based on background brightness
function getBrightness(color) {
  if (!color) return 255;
  return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
}

// Update the handleTreemapClick function
function handleTreemapClick(d, gender, parentType, svg) {
  // Extract the necessary information
  const targetGender = gender.toLowerCase();
  const characterType = d.data.type;
  const emotion = d.data.name; // Assuming the name property contains the emotion
  
  // Call the updateGallery function from adsGallery.js
  if (window.updateGallery) {
    window.updateGallery(targetGender, characterType, emotion);
  } else {
    console.error("Gallery update function not found");
  }
  
  // Other treemap click handling code...
  const cellType = d.data.type || d.data.name;
  console.log(`Clicked: ${gender}, ${parentType}, ${cellType}`);
  
  const breadcrumb = document.getElementById(`breadcrumb-${gender}`);
  const backButton = document.getElementById(`back-button-${gender}`);
  
  // Check if we're already at the second level (emotion/mood details)
  if (parentType !== null) {
    console.log("Already at second level, not going deeper");
    // Just update the breadcrumb text to show what was clicked
    breadcrumb.textContent = `Visual Subject > ${parentType} > ${d.data.name}`;
    
    // Update gallery for the clicked emotion or mood
    if (parentType === "both") {
      // For "both" category, determine if it's a woman or man emotion
      const isWomenEmotion = d.data.type === "woman_emotion";
      updateGallery(gender, parentType, d.data.name, isWomenEmotion ? "woman" : "man");
    } else if (parentType === "none") {
      // For "none" category, this is a mood
      updateGallery(gender, parentType, null, null, d.data.name);
    } else {
      // For women_only or men_only category, this is an emotion
      updateGallery(gender, parentType, d.data.name);
    }
    
    return;
  }
  
  // If we're already in the "both" category and clicking on a gender group
  if (parentType === "both" && d.depth === 1) {
    const genderGroup = d.data.name === "Women's Emotions" ? "woman" : "man";
    console.log(`Clicked on ${genderGroup} group in "both" category`);
    breadcrumb.textContent = `Visual Subject > Both > ${d.data.name}`;
    
    // Update gallery with the specific gender group in "both" category
    updateGallery(gender, "both", null, genderGroup);
    
    return;
  }
  
  // We're at first level, so proceed to second level
  // Save current view to history
  navHistory[gender].push({
    data: svg.characterData,
    parentType: null,
    breadcrumbText: breadcrumb.textContent
  });
  
  // Update breadcrumb
  breadcrumb.textContent = `Visual Subject > ${d.data.name}`;
  
  // Show back button
  backButton.style.display = 'block';
  
  // Generate second-level data for emotions
  const secondLevelData = generateEmotionData(gender, cellType);
  
  // Render the second level treemap
  renderTreemap(svg, secondLevelData, gender, cellType);
  
  // Update gallery for the first-level category
  updateGallery(gender, cellType);
}

// Update the generateEmotionData function to define filteredAds properly

function generateEmotionData(gender, characterType) {
  // Filter ads for the current era, gender, and character type
  // CRITICAL FIX: filteredAds was being used without being defined
  const filteredAds = adsData.filter(ad => {
    // Match era
    if (ad.year < currentEraData.start_year || ad.year > currentEraData.end_year) {
      return false;
    }
    
    // Match gender
    if (ad.gender.toLowerCase() !== gender) {
      return false;
    }
    
    // Match character type
    if (!ad.analysis?.vision?.people) {
      return characterType === "none";
    }
    
    const hasWomen = ad.analysis.vision.people.some(p => p.gender === "woman");
    const hasMen = ad.analysis.vision.people.some(p => p.gender === "man");
    const hasUnclearGender = ad.analysis.vision.people.some(p => 
      p.gender === "unclear" || !["woman", "man"].includes(p.gender));
    
    if (characterType === "women_only") {
      return hasWomen && !hasMen;
    } else if (characterType === "men_only") {
      return !hasWomen && hasMen;
    } else if (characterType === "both") {
      return hasWomen && hasMen;
    } else if (characterType === "unclear_gender") {
      return hasUnclearGender && !hasWomen && !hasMen;
    } else if (characterType === "none") {
      return ad.analysis.vision.people.length === 0;
    }
    
    return false;
  });
  
  console.log(`Found ${filteredAds.length} ads for ${gender} with character type ${characterType}`);
  
  // Special handling for "both" category - split between women and men
  if (characterType === "both") {
    // Get emotions for women in "both" category
    const womenEmotions = {};
    // Get emotions for men in "both" category
    const menEmotions = {};
    
    filteredAds.forEach(ad => {
      if (!ad.analysis?.vision?.people) return;
      
      // Process women's emotions
      const women = ad.analysis.vision.people.filter(p => p.gender === "woman");
      women.forEach(woman => {
        if (!woman.emotion_tags) return;
        
        // Take first 3 emotions
        const topEmotions = woman.emotion_tags.slice(0, 3);
        topEmotions.forEach(emotion => {
          if (!womenEmotions[emotion]) {
            womenEmotions[emotion] = 0;
          }
          womenEmotions[emotion]++;
        });
      });
      
      // Process men's emotions
      const men = ad.analysis.vision.people.filter(p => p.gender === "man");
      men.forEach(man => {
        if (!man.emotion_tags) return;
        
        // Take first 3 emotions
        const topEmotions = man.emotion_tags.slice(0, 3);
        topEmotions.forEach(emotion => {
          if (!menEmotions[emotion]) {
            menEmotions[emotion] = 0;
          }
          menEmotions[emotion]++;
        });
      });
    });
    
    // Calculate total values for each section to ensure proper space allocation
    const totalWomenValue = Object.values(womenEmotions).reduce((sum, val) => sum + val, 0);
    const totalMenValue = Object.values(menEmotions).reduce((sum, val) => sum + val, 0);
    
    // Calculate fixed weightings to ensure proper division of space
    // We want women and men to occupy roughly equal space
    const totalCombined = totalWomenValue + totalMenValue;
    const womenWeight = totalCombined > 0 ? 0.5 : 0;
    const menWeight = totalCombined > 0 ? 0.5 : 0;
    
    // Create women's emotions data with consistent scale
    const womenEmotionData = Object.entries(womenEmotions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Take top 5 emotions
      .map(([emotion, count], index) => {
        return {
          name: emotion,
          // Scale the value to maintain proper weighting
          value: (count / totalWomenValue) * totalCombined * womenWeight,
          color: adjustColorBrightness(genderColors.women, index * 5),
          type: "woman_emotion" // Mark as woman emotion for filtering
        };
      });
      
    // Create men's emotions data with consistent scale
    const menEmotionData = Object.entries(menEmotions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Take top 5 emotions
      .map(([emotion, count], index) => {
        return {
          name: emotion,
          // Scale the value to maintain proper weighting
          value: (count / totalMenValue) * totalCombined * menWeight,
          color: adjustColorBrightness(genderColors.men, index * 5),
          type: "man_emotion" // Mark as man emotion for filtering
        };
      });
    
    // Return a flat structure with no section headers
    return {
      name: "root",
      children: [
        // Women's emotions
        ...womenEmotionData,
        
        // Men's emotions
        ...menEmotionData
      ].filter(d => d.value > 0)
    };
  }
  
  // Extract and count emotions for other people categories (not "both" and not "none")
  else if (characterType !== "none") {
    const emotions = {};
    
    filteredAds.forEach(ad => {
      if (!ad.analysis?.vision?.people) return;
      
      // Based on character type, collect emotions from relevant people
      let relevantPeople = [];
      
      if (characterType === "women_only") {
        relevantPeople = ad.analysis.vision.people.filter(p => p.gender === "woman");
      } else if (characterType === "men_only") {
        relevantPeople = ad.analysis.vision.people.filter(p => p.gender === "man");
      } else if (characterType === "unclear_gender") {
        relevantPeople = ad.analysis.vision.people.filter(p => 
          p.gender === "unclear" || !["woman", "man"].includes(p.gender));
      }
      
      // Extract emotions from each person (taking first 3 emotions)
      relevantPeople.forEach(person => {
        if (!person.emotion_tags) return;
        
        // Take first 3 emotions for each person
        const topEmotions = person.emotion_tags.slice(0, 3);
        
        topEmotions.forEach(emotion => {
          if (!emotions[emotion]) {
            emotions[emotion] = 0;
          }
          emotions[emotion]++;
        });
      });
    });

    // If we found no emotions (which shouldn't happen for people categories), return an empty state
    if (Object.keys(emotions).length === 0) {
      return {
        name: "root",
        children: [{
          name: "No emotions found",
          value: 1,
          color: "#CCCCCC"
        }]
      };
    }
    
    // Convert to format suitable for treemap
    const emotionData = Object.entries(emotions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Take top 10 emotions
      .map(([emotion, count], index) => {
        // Use color based on character type, but maintain the color scheme
        let baseColor;
        
        if (characterType === "women_only") {
          baseColor = genderColors.women;
        } else if (characterType === "men_only") {
          baseColor = genderColors.men;
        } else if (characterType === "unclear_gender") {
          baseColor = genderColors.unclear;
        } else {
          baseColor = "#AAA"; // Fallback
        }
        
        return {
          name: emotion,
          value: count,
          color: adjustColorBrightness(baseColor, index * 5),
          type: emotion
        };
      });
    
    // Return hierarchical structure for treemap
    return {
      name: "root",
      children: emotionData
    };
  } else {
    // For "none" character type, use mood tags but with a neutral color
    return generateMoodData(gender, filteredAds);
  }
}

// Update the generateMoodData function to handle the filteredAds parameter correctly

function generateMoodData(gender, filteredAdsList) {
  const moods = {};
  
  // Make a local copy to avoid modifying the parameter
  let adsList = filteredAdsList;
  
  // If no ads provided, filter them
  if (!adsList || adsList.length === 0) {
    adsList = adsData.filter(ad => {
      return ad.year >= currentEraData.start_year && 
             ad.year <= currentEraData.end_year && 
             ad.gender.toLowerCase() === gender &&
             (!ad.analysis?.vision?.people || ad.analysis.vision.people.length === 0);
    });
  }
  
  adsList.forEach(ad => {
    if (ad.analysis?.vision?.mood_tags && ad.analysis.vision.mood_tags.length > 0) {
      // Take first 3 mood tags
      const topMoods = ad.analysis.vision.mood_tags.slice(0, 3);
      
      topMoods.forEach(mood => {
        if (!moods[mood]) {
          moods[mood] = 0;
        }
        moods[mood]++;
      });
    }
  });
  
  // Convert to format suitable for treemap
  const moodData = Object.entries(moods)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // Top 10 moods
    .map(([mood, count], index) => {
      // Use a neutral gray color for moods (since there's no character gender)
      return {
        name: mood,
        value: count,
        color: adjustColorBrightness("#DEDEDE", index * 3),
        type: mood
      };
    });
  
  return {
    name: "root",
    children: moodData.length > 0 ? moodData : [{
      name: "No mood tags found",
      value: 1,
      color: "#CCCCCC"
    }]
  };
}

// Helper function to adjust color brightness
function adjustColorBrightness(hexColor, percent) {
  // Convert hex to RGB
  let r = parseInt(hexColor.slice(1, 3), 16);
  let g = parseInt(hexColor.slice(3, 5), 16);
  let b = parseInt(hexColor.slice(5, 7), 16);
  
  // Make color lighter by specified percentage (0-100)
  r = Math.min(255, Math.floor(r * (1 + percent/100)));
  g = Math.min(255, Math.floor(g * (1 + percent/100)));
  b = Math.min(255, Math.floor(b * (1 + percent/100)));
  
  // Convert back to hex
  return "#" + 
    r.toString(16).padStart(2, '0') + 
    g.toString(16).padStart(2, '0') + 
    b.toString(16).padStart(2, '0');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initializing adsTreemap.js");
  
  // Load ad data
  loadAdsData().then(() => {
    // First try to get the current era from window.currentEra
    if (window.currentEra) {
      console.log("Using window.currentEra:", window.currentEra);
      initializeTreemaps(window.currentEra);
    }
    // If not available, try to get current era based on the active year
    else if (window.summaryData) {
      const currentYear = parseInt(d3.select(".step.is-active").text());
      const currentEra = window.summaryData.find(era => 
        currentYear >= era.start_year && currentYear <= era.end_year
      );
      
      if (currentEra) {
        console.log("Using era from current year:", currentEra);
        initializeTreemaps(currentEra);
      } else {
        // Fallback to default era as last resort
        console.log("Using default era");
        initializeTreemaps(currentEraData);
      }
    } else {
      console.log("Using fallback era data");
      initializeTreemaps(currentEraData);
    }
    
    // Initialize the gallery
    initializeGallery();
  });
  
  // Listen for era changes
  document.addEventListener('eraChanged', function(e) {
    if (e.detail && e.detail.era) {
      // Only update if the era has actually changed
      const newEraId = `${e.detail.era.start_year}-${e.detail.era.end_year}`;
      
      if (newEraId !== currentEraId) {
        console.log('Era changed from', currentEraId, 'to', newEraId);
        initializeTreemaps(e.detail.era);
      } else {
        console.log('Same era, not updating treemaps');
      }
    }
  });
  
  // Listen for view toggle to reset state when switching away from ads
  document.addEventListener('viewToggled', function(e) {
    if (e.detail && e.detail.view === 'notes') {
      // Reset navigation history when switching away from ads view
      ["women", "men", "unisex"].forEach(gender => {
        navHistory[gender] = [];
        const backButton = document.getElementById(`back-button-${gender}`);
        const breadcrumb = document.getElementById(`breadcrumb-${gender}`);
        
        if (backButton) backButton.style.display = 'none';
        if (breadcrumb) breadcrumb.textContent = 'Visual Subject';
      });
    }
  });
});

// Create a new function to initialize treemaps and update currentEraId
function initializeTreemaps(era) {
  // Update global tracking variables
  currentEraData = era;
  currentEraId = `${era.start_year}-${era.end_year}`;
  
  // Create the treemaps
  createTreemaps(era);
}