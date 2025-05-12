// Ad Detail Modal Handler

let notesMapping = {}; // Will store notes mapping data
let currentAd = null; // Track the current ad being displayed

// Initialize the modal with event listeners
function initializeAdDetailModal() {
  // Close modal when clicking outside content
  document.getElementById('ad-detail-modal').addEventListener('click', function(event) {
    if (event.target === this) {
      closeAdDetailModal();
    }
  });
  
  // Setup tooltip functionality
  setupNoteTooltips();
}

// Open the modal with ad data
function openAdDetailModal(adData) {
  currentAd = adData;
  const modal = document.getElementById('ad-detail-modal');
  
  // Populate image and basic info
  document.getElementById('ad-detail-image').src = adData.public_url || adData['ad-image'];
  document.getElementById('ad-detail-title').textContent = `${adData.name} by ${adData.brand}`;
  document.getElementById('ad-detail-info').innerHTML = `
    <div>${adData.year} · for ${capitalizeFirstLetter(adData.gender)}</div>
  `;
  
  // Handle external link - use link.svg from assets folder
  const externalLink = document.getElementById('ad-external-link');
  if (adData.url && adData.url.trim() !== '') {
    // Update the HTML to use your custom SVG
    externalLink.innerHTML = `<img src="assets/link.svg" alt="External link" width="16" height="16">`;
    externalLink.href = adData.url;
    externalLink.classList.remove('hidden');
  } else {
    externalLink.classList.add('hidden');
  }
  
  // Add copy text if available
  const copyElement = document.getElementById('ad-detail-copy');
  if (adData.copy && adData.copy.trim() !== '') {
    copyElement.innerHTML = `<blockquote>"${adData.copy}"</blockquote>`;
    copyElement.style.display = 'block';
  } else {
    copyElement.style.display = 'none';
  }
  
  // Populate notes rows
  populateNotesRow('Top', adData.Top || []);
  populateNotesRow('Middle', adData.Middle || []);
  populateNotesRow('Base', adData.Base || []);
  
  // Show modal
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent scrolling of background
}

// Close the modal
function closeAdDetailModal() {
  document.getElementById('ad-detail-modal').classList.add('hidden');
  document.body.style.overflow = ''; // Restore scrolling
  currentAd = null;
}

// Populate a row of notes with colored rectangles
function populateNotesRow(type, notes) {
  const rowId = `${type.toLowerCase()}-notes-row`;
  const container = document.getElementById(rowId);
  container.innerHTML = '';
  
  if (!notes || notes.length === 0) {
    // Create a custom message specific to each note type
    const messagesByType = {
      'top': 'No top notes available',
      'middle': 'No middle notes available',
      'base': 'No base notes available'
    };
    
    // Get the type-specific message or fallback to generic one
    const message = messagesByType[type.toLowerCase()] || 'No notes available';
    
    // Add the message with styling
    container.innerHTML = `<em>${message}</em>`;
    return;
  }
  
  notes.forEach(note => {
    const noteColor = getNoteColor(note);
    const noteElement = document.createElement('div');
    noteElement.className = 'note-item';
    noteElement.style.backgroundColor = noteColor;
    noteElement.dataset.note = note;
    noteElement.dataset.type = type.toLowerCase(); // Add type information
    container.appendChild(noteElement);
  });
}

// Get color for a note from mapping
function getNoteColor(noteName) {
  // Default color if mapping not found
  const defaultColor = '#CCCCCC';
  
  // Normalize the note name for comparison
  const normalizedName = noteName.toLowerCase().trim();
  
  // Check if we have categories in the mapping
  if (notesMapping && notesMapping.categories) {
    // Search through each category
    for (const categoryName in notesMapping.categories) {
      const category = notesMapping.categories[categoryName];
      
      // Check if this category contains the note
      if (category.notes && Array.isArray(category.notes)) {
        // Search for the note (case-insensitive)
        const foundNote = category.notes.find(note => 
          note.toLowerCase().trim() === normalizedName
        );
        
        if (foundNote) {
          return category.color;
        }
      }
    }
  }
  
  console.log(`No color mapping found for note: "${noteName}"`);
  return defaultColor;
}

// Setup tooltip functionality for note items
function setupNoteTooltips() {
  const tooltip = document.getElementById('note-tooltip');
  let activeNoteItem = null;
  
  // Delegate event handling to parent container
  document.addEventListener('mouseover', function(event) {
    if (event.target.classList.contains('note-item')) {
      const note = event.target.dataset.note;
      const type = event.target.dataset.type || '';
      
      // Format tooltip with note name and position (if available)
      if (type) {
        tooltip.textContent = `${capitalizeFirstLetter(type)} note: ${note}`;
      } else {
        tooltip.textContent = note;
      }
      
      // Show tooltip at the mouse position
      tooltip.style.left = (event.clientX + 15) + 'px';
      tooltip.style.top = (event.clientY + 15) + 'px';
      tooltip.classList.remove('hidden');
      
      // Store reference to current active note item
      activeNoteItem = event.target;
    }
  });
  
  document.addEventListener('mouseout', function(event) {
    if (event.target.classList.contains('note-item')) {
      tooltip.classList.add('hidden');
      activeNoteItem = null;
    }
  });
  
  // Update tooltip position when moving mouse over a note item
  document.addEventListener('mousemove', function(event) {
    // Only move tooltip if it's visible and we're still on a note item
    if (!tooltip.classList.contains('hidden') && activeNoteItem) {
      tooltip.style.left = (event.clientX + 15) + 'px';
      tooltip.style.top = (event.clientY + 15) + 'px';
    }
  });
}

// Set notes mapping data
function setNotesMapping(mapping) {
  notesMapping = mapping;
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Export functions
export { 
  initializeAdDetailModal, 
  openAdDetailModal, 
  closeAdDetailModal,
  setNotesMapping
};