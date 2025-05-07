import { setupScrolly } from './scrollama.js';
import { getNoteGenderCountsByYearWithType, getNoteTrendOverTime, getCoOccurringNotes } from './dataPrep.js';
import { renderPieChart } from './pieChart.js';
import { renderStackedBarChart, resetExpandedNote } from './stackedBar.js';
import { loadMilestones, updateMilestoneDisplay } from './milestone.js';
import { loadAdData, updateAdPreview } from './adPreview.js';
import { renderNotesGraph } from './notesGraph.js';
import { updateEraDisplay } from './eraDisplay.js';

function getDecadeLabel(year) {
  if (year <= 1980) {
    const start = Math.floor(year / 10) * 10;
    return `${start}–${start + 9}`;
  }
  return `${year}`;
}

function getAggregatedNoteDataForDecade(noteCountsByYear, decadeStart) {
  const result = {};

  for (let y = decadeStart; y <= decadeStart + 9; y++) {
    const notes = noteCountsByYear[y];
    if (!notes) continue;

    for (const [note, counts] of Object.entries(notes)) {
      if (!result[note]) {
        result[note] = {
          women: 0,
          men: 0,
          unisex: 0,
          noteTypes: new Set()
        };
      }

      result[note].women += counts.women;
      result[note].men += counts.men;
      result[note].unisex += counts.unisex;
      result[note].noteTypes.add(counts.noteType);
    }
  }

  for (const note in result) {
    result[note].noteTypes = Array.from(result[note].noteTypes);
  }

  return result;
}

Promise.all([
  d3.json('../data/release_year.json'),
  d3.json('../data/fragrantica.json'),
  d3.json('../data/notes_mapping.json'),
  d3.json('../data/gender_milestone.json'),
  d3.json('../ad/advertising_archives.json'),
  d3.json('../data/summary.json') // Add this line to load summary data
]).then(([releaseData, fragranceData, notesMap, milestoneData, adArchive, summaryData]) => {
  // Make release data global so scrollama.js can access it
  window.releaseData = releaseData;

  // Add this line to make summary data globally available
  window.summaryData = summaryData;

  const noteCountsByYear = getNoteGenderCountsByYearWithType(fragranceData);
  window.fragranceData = fragranceData; 
  window.notesMap = notesMap;

  window.milestones = milestoneData;
  window.adData = adArchive;
  
  // Precompute trend data for all notes to improve performance
  console.log("Precomputing trend data for all notes...");
  const allNoteTrends = {};
  // First get a list of all unique notes
  const allNotes = new Set();
  fragranceData.forEach(f => {
    [...(f.Top || []), ...(f.Middle || []), ...(f.Base || [])].forEach(note => {
      if (note) allNotes.add(note);
    });
  });
  
  // Then compute trend data for each note
  console.log(`Found ${allNotes.size} unique notes. Computing trends...`);
  Array.from(allNotes).forEach(note => {
    allNoteTrends[note] = getNoteTrendOverTime(fragranceData, note);
  });
  window.allNoteTrends = allNoteTrends;
  console.log("Trend data computation complete.");

  const availableYears = releaseData
    .map(d => d.year)
    .filter(y => y >= 1900 && y <= 2025)
    .sort((a, b) => a - b);

  let currentNoteTypeFilter = 'all'; // top, middle, base, or all
  let currentGenderFilter = 'all';   // women, men, unisex, or all
  window.currentSearchTerm = '';

  loadMilestones(milestoneData);
  loadAdData(adArchive);

  setupScrolly(availableYears, (year) => {
    const decadeLabel = getDecadeLabel(year);
    // document.getElementById("year-text").textContent = decadeLabel;

    const pieData = releaseData.find(d => d.year === year);
    if (pieData) renderPieChart(pieData);

    let noteData;
    if (year <= 1980) {
      const decadeStart = Math.floor(year / 10) * 10;
      noteData = getAggregatedNoteDataForDecade(noteCountsByYear, decadeStart);
    } else {
      noteData = noteCountsByYear[year];
    }

    if (year > 1980) {
      // Normalize noteType → noteTypes for consistency with pre-1980 data
      for (const note in noteData) {
        const type = noteData[note].noteType;
        noteData[note].noteTypes = type ? [type] : [];
      }
    }

    // Add notes graph rendering with filters
    renderNotesGraph(noteData, notesMap, currentNoteTypeFilter, currentGenderFilter);

    // Reset any expanded note when scrolling
    resetExpandedNote();

    renderStackedBarChart(noteData, notesMap, currentNoteTypeFilter, currentGenderFilter);

    updateMilestoneDisplay(year);
    updateAdPreview(year);

    // Update era display
    updateEraDisplay(year, summaryData);
  });

  // Immediately update the era display for the initial year
  const initialYear = availableYears[0];
  updateEraDisplay(initialYear, summaryData);

  // Replace button event handlers with dropdown handlers
  document.getElementById("gender-filter").addEventListener("change", function() {
    const selected = this.value;
    currentGenderFilter = selected;
    updateCharts();
  });

  document.getElementById("notes-filter").addEventListener("change", function() {
    const selected = this.value;
    currentNoteTypeFilter = selected;
    updateCharts();
  });

  // Keep the existing search handler
  document.getElementById("note-search").addEventListener("input", function(e) {
    window.currentSearchTerm = e.target.value.toLowerCase();
    updateCharts();
  });
  
  function updateCharts() {
    const currentYear = parseInt(d3.select(".step.is-active").text());
    const decadeLabel = getDecadeLabel(currentYear);
    // document.getElementById("year-text").textContent = decadeLabel;
  
    let noteData;
    if (currentYear <= 1980) {
      const decadeStart = Math.floor(currentYear / 10) * 10;
      noteData = getAggregatedNoteDataForDecade(noteCountsByYear, decadeStart);
    } else {
      noteData = noteCountsByYear[currentYear];
    }
  
    // Normalize if needed
    if (currentYear > 1980) {
      for (const note in noteData) {
        const type = noteData[note].noteType;
        noteData[note].noteTypes = type ? [type] : [];
      }
    }
  
    // Add notes graph rendering with filters
    renderNotesGraph(noteData, notesMap, currentNoteTypeFilter, currentGenderFilter);
  
    // Don't reset expanded note on filtering - only when scrolling
    // This ensures the detail view persists when changing filters
    // resetExpandedNote(); - remove this line
    renderStackedBarChart(noteData, notesMap, currentNoteTypeFilter, currentGenderFilter);
  }
});

// Debug check for global functions
console.log("Navigation functions available: ", {
  scrollToYear: typeof window.scrollToYear === 'function',
  updateEraProgress: typeof window.updateEraProgress === 'function'
});