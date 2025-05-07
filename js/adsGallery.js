// AdsGallery - Handle gallery display and synchronization with treemap interactions

// Global variables to store ads data and active filters
let adsData = [];
let activeFilters = [];
let currentEra = null; // Add this to track the current era

// Initialize the gallery functionality
function initializeGallery() {
  // Set up the gallery container
  const galleryContainer = document.getElementById('gallery-container');
  
  // Style the gallery container
  galleryContainer.innerHTML = '';
  galleryContainer.style.position = 'relative';
  galleryContainer.style.overflow = 'hidden'; // Hide overflow
  galleryContainer.style.height = '250px';
  
  // Create a carousel container for the ads
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'gallery-carousel';
  carouselContainer.style.display = 'flex';
  carouselContainer.style.height = 'calc(100% - 30px)'; // Leave room for counter
  carouselContainer.style.alignItems = 'center'; // Vertically center images
  carouselContainer.style.transition = 'transform 0.4s ease';
  carouselContainer.style.padding = '15px 0';
  
  // Create navigation buttons
  const prevBtn = document.createElement('button');
  prevBtn.className = 'gallery-nav prev-btn';
  prevBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 4L7 12L15 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  
  const nextBtn = document.createElement('button');
  nextBtn.className = 'gallery-nav next-btn';
  nextBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 4L17 12L9 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  
  // Create counter indicator
  const counterIndicator = document.createElement('div');
  counterIndicator.className = 'gallery-counter';
  counterIndicator.textContent = 'No ads selected';
  
  // Add elements to container
  galleryContainer.appendChild(carouselContainer);
  galleryContainer.appendChild(prevBtn);
  galleryContainer.appendChild(nextBtn);
  galleryContainer.appendChild(counterIndicator);
  
  // Initially show a message
  carouselContainer.innerHTML = '<div class="gallery-message">Click on a treemap section to view ads</div>';
  
  // Apply styling
  const style = document.createElement('style');
  style.textContent = `
    .gallery-message {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #777;
      font-family: "instrument-sans-variable", sans-serif;
      font-size: 14px;
      height: 100%;
    }
    
    .gallery-item {
      height: 100%;
      margin: 0 10px;
      position: relative;
      flex-shrink: 0;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    
    .gallery-item:hover {
      transform: translateY(-5px);
    }
    
    .gallery-item img {
      height: 100%;
      object-fit: contain;
      border-radius: 4px;
    }
    
    .gallery-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      background-color: rgba(255, 255, 255, 0.8);
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 5;
      color: #333;
      transition: background-color 0.2s;
    }
    
    .gallery-nav:hover {
      background-color: rgba(255, 255, 255, 1);
    }
    
    .gallery-nav.prev-btn {
      left: 15px;
    }
    
    .gallery-nav.next-btn {
      right: 15px;
    }
    
    .gallery-nav.hidden {
      display: none;
    }
    
    .gallery-counter {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      font-family: "instrument-sans-variable", sans-serif;
      font-size: 12px;
      color: #666;
      background-color: rgba(255, 255, 255, 0.8);
      padding: 4px 12px;
      border-radius: 12px;
    }
  `;
  
  document.head.appendChild(style);
  
  // Set up navigation controls
  let currentPosition = 0;
  prevBtn.style.display = 'none';  // Initially hide prev button
  nextBtn.style.display = 'none';  // Initially hide next button
  
  // Add navigation functionality
  prevBtn.addEventListener('click', () => {
    const containerWidth = galleryContainer.clientWidth;
    currentPosition = Math.min(currentPosition + containerWidth, 0);
    carouselContainer.style.transform = `translateX(${currentPosition}px)`;
    updateNavButtons();
  });
  
  nextBtn.addEventListener('click', () => {
    const containerWidth = galleryContainer.clientWidth;
    const maxScroll = carouselContainer.scrollWidth - containerWidth;
    currentPosition = Math.max(currentPosition - containerWidth, -maxScroll);
    carouselContainer.style.transform = `translateX(${currentPosition}px)`;
    updateNavButtons();
  });
  
  // Function to update nav button visibility
  function updateNavButtons() {
    prevBtn.style.display = currentPosition < 0 ? 'flex' : 'none';
    
    const containerWidth = galleryContainer.clientWidth;
    const maxScroll = carouselContainer.scrollWidth - containerWidth;
    nextBtn.style.display = -currentPosition < maxScroll ? 'flex' : 'none';
  }
  
  // Attach the updateNavButtons function to the window object for access from renderGallery
  window.updateGalleryNavButtons = updateNavButtons;
  
  // Listen for era changes from the main timeline
  document.addEventListener('eraChanged', function(event) {
    if (event.detail && event.detail.era) {
      currentEra = event.detail.era;
      console.log("Gallery: Era changed to", currentEra.era);
      
      // Update gallery when era changes
      updateGalleryForCurrentEra();
    }
  });
  
  // Load the ads data if not already loaded
  if (adsData.length === 0) {
    loadAdsData();
  }
}

// New function to update gallery based on current era
function updateGalleryForCurrentEra() {
  if (!currentEra || adsData.length === 0) return;
  
  // Filter ads by era
  const filteredByEra = adsData.filter(ad => 
    ad.year >= currentEra.start_year && ad.year <= currentEra.end_year
  );
  
  // Reset filters but keep the era constraint
  activeFilters = [];
  
  // Render the gallery with era-filtered ads
  renderGallery(filteredByEra, `${currentEra.era} (${currentEra.start_year}-${currentEra.end_year})`);
}

// Load ad analysis data
function loadAdsData() {
  fetch('ad/ad_analysis.json')
    .then(response => response.json())
    .then(data => {
      console.log(`Gallery: Loaded ${data.length} ads`);
      adsData = data;
      
      // If we already have an era selected, update gallery
      if (currentEra) {
        updateGalleryForCurrentEra();
      } else if (window.currentEra) {
        // Use the global era if available
        currentEra = window.currentEra;
        updateGalleryForCurrentEra();
      }
    })
    .catch(error => {
      console.error('Error loading the JSON data:', error);
      document.getElementById('gallery-container').innerHTML = 
        '<div class="gallery-message">Error loading ad data</div>';
    });
}

// Update gallery based on treemap interactions
function updateGallery(targetGender, characterType, emotion = null) {
  // Update active filters
  updateFilters(targetGender, characterType, emotion);
  
  // First filter by era, then apply other filters
  const filteredByEra = currentEra ? 
    adsData.filter(ad => ad.year >= currentEra.start_year && ad.year <= currentEra.end_year) : 
    adsData;
  
  // Apply character/emotion filters to era-filtered ads
  const filteredAds = filterAdsByActiveFilters(filteredByEra);
  
  // Create descriptive context for the filter
  let filterContext;
  
  if (emotion) {
    // If emotion is specified, include it in the context
    filterContext = `${capitalizeFirstLetter(targetGender)} - ${formatCharacterType(characterType)} - ${formatEmotion(emotion)}`;
  } else {
    // Otherwise, just show gender and character type
    filterContext = `${capitalizeFirstLetter(targetGender)} - ${formatCharacterType(characterType)}`;
  }
  
  // Render gallery with filtered ads and context label
  renderGallery(filteredAds, filterContext);
  
  // Log filtering information for debugging
  console.log(`Gallery filtered: ${filteredAds.length} ads match "${filterContext}"`);
}

// Helper function to make character types more readable
function formatCharacterType(type) {
  switch(type) {
    case "women_only": return "Women Only";
    case "men_only": return "Men Only";
    case "both": return "Both Genders";
    case "none": return "No People";
    default: return type;
  }
}

// Helper function to format emotion names
function formatEmotion(emotion) {
  // Convert snake_case to Title Case
  return emotion
    .split('_')
    .map(word => capitalizeFirstLetter(word))
    .join(' ');
}

// Update the active filters based on treemap interaction
function updateFilters(targetGender, characterType, emotion = null) {
  // Clear existing filters for this gender
  activeFilters = activeFilters.filter(f => f.targetGender !== targetGender);
  
  // Add new filter
  const newFilter = {
    targetGender: targetGender,
    characterType: characterType
  };
  
  // Add emotion if provided
  if (emotion) {
    newFilter.emotion = emotion;
  }
  
  activeFilters.push(newFilter);
  
  // Store the last used filter for potential reset operations
  window.lastActiveFilter = {
    targetGender,
    characterType,
    emotion
  };
}

// Modified filter function to accept a pre-filtered dataset
function filterAdsByActiveFilters(adsToFilter = adsData) {
  if (activeFilters.length === 0) return adsToFilter;
  
  return adsToFilter.filter(ad => {
    // Check if the ad matches any of the active filters
    return activeFilters.some(filter => {
      // Check target gender
      if (ad.gender.toLowerCase() !== filter.targetGender) {
        return false;
      }
      
      // Check character type
      if (filter.characterType) {
        // Character breakdown
        if (!ad.analysis?.vision?.people) {
          // If no people data and filter requires people
          if (filter.characterType !== "none") {
            return false;
          }
        } else {
          const hasWomen = ad.analysis.vision.people.some(p => p.gender === "woman");
          const hasMen = ad.analysis.vision.people.some(p => p.gender === "man");
          
          // Check specific character type
          switch (filter.characterType) {
            case "women_only":
              if (!hasWomen || hasMen) return false;
              break;
            case "men_only":
              if (!hasMen || hasWomen) return false;
              break;
            case "both":
              if (!hasWomen || !hasMen) return false;
              break;
            case "none":
              if (ad.analysis.vision.people.length > 0) return false;
              break;
          }
          
          // If emotion is specified, check if any person has this emotion
          if (filter.emotion && filter.characterType !== "none") {
            // Check relevant gender based on filter and character type
            let relevantPeople;
            
            if (filter.characterType === "women_only" || 
               (filter.characterType === "both" && filter.gender === "woman")) {
              relevantPeople = ad.analysis.vision.people.filter(p => p.gender === "woman");
            } else if (filter.characterType === "men_only" || 
                      (filter.characterType === "both" && filter.gender === "man")) {
              relevantPeople = ad.analysis.vision.people.filter(p => p.gender === "man");
            } else {
              relevantPeople = ad.analysis.vision.people;
            }
            
            // Check if any relevant person has the emotion
            const hasEmotion = relevantPeople.some(person => 
              person.emotion_tags && person.emotion_tags.includes(filter.emotion)
            );
            
            if (!hasEmotion) return false;
          }
        }
        
        // Check mood for "none" character type
        if (filter.characterType === "none" && filter.mood) {
          if (!ad.analysis?.vision?.mood_tags || 
              !ad.analysis.vision.mood_tags.includes(filter.mood)) {
            return false;
          }
        }
      }
      
      // If we got here, the ad passed all filter conditions
      return true;
    });
  });
}

// Modify renderGallery to accept a context label
function renderGallery(ads, contextLabel = '') {
  const galleryContainer = document.getElementById('gallery-container');
  const carouselContainer = galleryContainer.querySelector('.gallery-carousel');
  const counterIndicator = galleryContainer.querySelector('.gallery-counter');
  
  // Reset current position
  carouselContainer.style.transform = 'translateX(0)';
  let currentPosition = 0;
  
  // Clear existing content
  carouselContainer.innerHTML = '';
  
  // Update counter with context
  counterIndicator.textContent = contextLabel ? 
    `${ads.length} ads · ${contextLabel}` : 
    `${ads.length} ads found`;
  
  // Handle no results case
  if (ads.length === 0) {
    carouselContainer.innerHTML = '<div class="gallery-message">No ads match the selected criteria</div>';
    // Hide navigation buttons
    document.querySelector('.prev-btn').style.display = 'none';
    document.querySelector('.next-btn').style.display = 'none';
    return;
  }
  
  // Create gallery items for each ad
  ads.forEach(ad => {
    // Create gallery item
    const item = document.createElement('div');
    item.className = 'gallery-item';
    
    // Create image
    const img = document.createElement('img');
    img.src = ad.public_url || `images/aa/${ad['ad-image']}` || 'placeholder.jpg';
    img.alt = `${ad.brand} ${ad.name} (${ad.year})`;
    img.dataset.brand = ad.brand;
    img.dataset.name = ad.name;
    img.dataset.year = ad.year;
    img.dataset.gender = ad.gender;
    
    img.onerror = function() {
      this.src = 'placeholder.jpg';
      this.alt = 'Image not found';
    };
    
    // Add click handler to show a larger preview
    item.addEventListener('click', () => showAdPreview(ad));
    
    // Append to item
    item.appendChild(img);
    carouselContainer.appendChild(item);
  });
  
  // Show/hide navigation buttons as needed
  setTimeout(() => {
    // Need to wait for images to load to get accurate scroll width
    if (window.updateGalleryNavButtons) {
      window.updateGalleryNavButtons();
    } else {
      const containerWidth = galleryContainer.clientWidth;
      const maxScroll = carouselContainer.scrollWidth - containerWidth;
      
      document.querySelector('.prev-btn').style.display = 'none'; // Initially at start
      document.querySelector('.next-btn').style.display = maxScroll > 0 ? 'flex' : 'none';
    }
  }, 300);
}

// Show ad preview in a modal or lightbox
function showAdPreview(ad) {
  // Similar implementation as before but with enhanced info display
  let previewBox = document.getElementById('ad-preview-box');
  
  if (!previewBox) {
    previewBox = document.createElement('div');
    previewBox.id = 'ad-preview-box';
    previewBox.className = 'ad-preview-modal';
    document.body.appendChild(previewBox);
    
    const style = document.createElement('style');
    style.textContent = `
      .ad-preview-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #FFFCF5;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 5px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 90%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow: auto;
      }
      
      .ad-preview-image {
        max-width: 100%;
        max-height: 80vh;
        object-fit: contain;
      }
      
      .ad-preview-info {
        margin-top: 15px;
        text-align: center;
        font-family: instrument-serif, serif;
      }
      
      .ad-preview-close {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 18px;
        color: #333;
      }
      
      .ad-copy {
        font-style: italic;
        margin-top: 10px;
        max-width: 600px;
        color: #555;
      }
    `;
    document.head.appendChild(style);
  } else {
    previewBox.innerHTML = '';
  }
  
  // Add close button
  const closeBtn = document.createElement('div');
  closeBtn.className = 'ad-preview-close';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => {
    previewBox.style.display = 'none';
  });
  
  // Add image
  const img = document.createElement('img');
  img.className = 'ad-preview-image';
  img.src = ad.public_url || `images/aa/${ad['ad-image']}` || 'placeholder.jpg';
  img.alt = `${ad.brand} ${ad.name} (${ad.year})`;
  
  // Add info
  const info = document.createElement('div');
  info.className = 'ad-preview-info';
  info.innerHTML = `
    <h3>${ad.brand} ${ad.name}</h3>
    <p>${ad.year} · ${capitalizeFirstLetter(ad.gender)}</p>
    ${ad.copy ? `<p class="ad-copy">"${ad.copy}"</p>` : ''}
  `;
  
  // Assemble preview
  previewBox.appendChild(closeBtn);
  previewBox.appendChild(img);
  previewBox.appendChild(info);
  
  // Show the preview
  previewBox.style.display = 'flex';
  
  // Close preview when clicking outside
  document.addEventListener('click', function closeOnOutsideClick(event) {
    if (!previewBox.contains(event.target) && event.target !== previewBox) {
      previewBox.style.display = 'none';
      document.removeEventListener('click', closeOnOutsideClick);
    }
  });
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Get color for gender
function getGenderColor(gender) {
  switch (gender.toLowerCase()) {
    case 'women': return '#A18888';
    case 'men': return '#515E6B';
    case 'unisex': return '#74705F';
    default: return '#777777';
  }
}

// Function to reset all active filters
function resetFilters() {
  activeFilters = [];
  if (currentEra) {
    updateGalleryForCurrentEra();
  } else {
    renderGallery(adsData, "All ads");
  }
}

// Export functions for use in other modules
export { 
  initializeGallery, 
  updateGallery,
  resetFilters  // Add this
};