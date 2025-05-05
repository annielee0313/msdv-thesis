// dataPrep.js

// stacked bar chart
export function getNoteGenderCountsByYearWithType(fragrances) {
    const result = {};
  
    fragrances.forEach(f => {
      const year = Math.floor(f.Year);
      const gender = f.Gender?.toLowerCase();
      if (!['women', 'men', 'unisex'].includes(gender) || isNaN(year)) return;
  
      const noteTypes = [
        { notes: f.Top || [], type: 'top' },
        { notes: f.Middle || [], type: 'middle' },
        { notes: f.Base || [], type: 'base' }
      ];
  
      noteTypes.forEach(({ notes, type }) => {
        notes.forEach(note => {
          if (!note) return;
  
          if (!result[year]) result[year] = {};
          if (!result[year][note]) {
            result[year][note] = {
              women: 0,
              men: 0,
              unisex: 0,
              noteType: type
            };
          }
  
          // Overwrite noteType if it was previously missing or from another type
          result[year][note].noteType = type;
  
          result[year][note][gender]++;
        });
      });
    });
  
    return result;
  }  
  
  export function getNoteTrendOverTime(fragrances, selectedNote) {
    const trend = {};
  
    fragrances.forEach(f => {
      const year = Math.floor(f.Year);
      const gender = f.Gender.toLowerCase();
      const notes = [...(f.Top || []), ...(f.Middle || []), ...(f.Base || [])];
  
      if (notes.includes(selectedNote)) {
        if (!trend[year]) trend[year] = { women: 0, men: 0, unisex: 0 };
        trend[year][gender]++;
      }
    });
  
    // Convert to array format sorted by year
    return Object.entries(trend)
      .map(([year, counts]) => ({ year: +year, ...counts }))
      .sort((a, b) => a.year - b.year);
  }
  
  export function getCoOccurringNotes(fragrances, selectedNote) {
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