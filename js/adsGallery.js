// AdsGallery - Handle gallery display and synchronization with treemap interactions

// Global variables to store ads data and active filters
let adsData = [];
let activeFilters = [];
let currentEra = null; // Add this to track the current era

// Import the modal functions
import { openAdDetailModal } from './adDetailModal.js';

// Initialize the gallery functionality
function initializeGallery() {
  // Set up the gallery container
  const galleryContainer = document.getElementById('gallery-container');
  
  // Style the gallery container - increase height and remove overflow constraint
  galleryContainer.innerHTML = '';
  galleryContainer.style.position = 'relative';
  galleryContainer.style.height = '280px'; // Increase height from 250px to 280px
  
  // Create a carousel container for the ads
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'gallery-carousel';
  carouselContainer.style.display = 'flex';
  carouselContainer.style.height = '100%'; 
  carouselContainer.style.alignItems = 'center'; 
  carouselContainer.style.transition = 'transform 0.4s ease';
  carouselContainer.style.padding = '15px 0 25px 0'; // Add more padding at the bottom
  
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
  
  // Set the initial gallery title
  const galleryTitle = document.getElementById('gallery-title');
  galleryTitle.textContent = 'No ads selected';
  
  // Add elements to container
  galleryContainer.appendChild(carouselContainer);
  galleryContainer.appendChild(prevBtn);
  galleryContainer.appendChild(nextBtn);
  
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
      height: 90%; /* Reduce from 100% to 90% to prevent cropping */
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
      max-height: 220px; /* Add max-height constraint */
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
    
    /* Remove the conflicting gallery-title style that positions it at the bottom */
    /* The title will now use the styles from your main CSS file */
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
function updateGallery(targetGender, characterType, emotion = null, specificGenderEmotion = null) {
  // Update active filters
  updateFilters(targetGender, characterType, emotion, specificGenderEmotion);
  
  // First filter by era, then apply other filters
  const filteredByEra = currentEra ? 
    adsData.filter(ad => ad.year >= currentEra.start_year && ad.year <= currentEra.end_year) : 
    adsData;
  
  // Apply character/emotion filters to era-filtered ads
  const filteredAds = filterAdsByActiveFilters(filteredByEra);
  
  // Create descriptive context for the filter
  let filterContext;
  
  if (emotion) {
    if (characterType === "both" && specificGenderEmotion) {
      // For "both genders" case with specific gender emotion
      // Format should be "Men - Both Genders - Intimate Men" or "Women - Both Genders - Happy Women"
      filterContext = `${capitalizeFirstLetter(targetGender)} - Both Genders - ${formatEmotion(emotion)} ${capitalizeFirstLetter(specificGenderEmotion)}`;
    } else {
      filterContext = `${capitalizeFirstLetter(targetGender)} - ${formatCharacterType(characterType)} - ${formatEmotion(emotion)}`;
    }
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
function updateFilters(targetGender, characterType, emotion = null, specificGenderEmotion = null) {
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
  
  // Add specific gender emotion if provided
  if (specificGenderEmotion) {
    newFilter.gender = specificGenderEmotion;
  }
  
  activeFilters.push(newFilter);
  
  // Store the last used filter for potential reset operations
  window.lastActiveFilter = { ...newFilter };
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

// Modify renderGallery to update the title instead of a separate counter
function renderGallery(ads, contextLabel = '') {
  const galleryContainer = document.getElementById('gallery-container');
  const carouselContainer = galleryContainer.querySelector('.gallery-carousel');
  const galleryTitle = document.getElementById('gallery-title');
  
  // Reset current position
  carouselContainer.style.transform = 'translateX(0)';
  let currentPosition = 0;
  
  // Clear existing content
  carouselContainer.innerHTML = '';
  
  // Update title with combined information
  if (contextLabel) {
    galleryTitle.textContent = `${ads.length} Ads · ${contextLabel}`;
  } else {
    galleryTitle.textContent = `${ads.length} Ads`;
  }
  
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

    // Use a more reliable approach to determine image source
    const imageUrl = ad.public_url || ad['ad-image'];
    img.src = imageUrl;
    img.alt = `${ad.brand} ${ad.name} (${ad.year})`;
    img.dataset.brand = ad.brand;
    img.dataset.name = ad.name;
    img.dataset.year = ad.year;
    img.dataset.gender = ad.gender;

    // Only use onerror if we need to (track attempts to avoid endless loops)
    img.onerror = function() {
      // Log which image failed for debugging
      console.warn(`Image failed to load: ${this.src}`);
      
      // Only try to use placeholder if we're not already trying to load it
      if (!this.src.includes('placeholder')) {
        // Use a correct relative path to placeholder
        this.src = './images/placeholder.jpg';
        this.alt = 'Image not found';
      }
    };

    // Add loading state handling
    img.className = 'loading';
    img.onload = function() {
      // Remove loading state when image successfully loads
      this.classList.remove('loading');
    };

    // Add click handler to show detail modal
    item.addEventListener('click', () => openAdDetailModal(ad));
    
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
function resetFilters(options = {}) {
  const { keepEraFilters = true, updateUI = true } = options;
  
  // Clear filters
  activeFilters = [];
  
  // Update display
  if (updateUI) {
    if (keepEraFilters && currentEra) {
      updateGalleryForCurrentEra();
    } else {
      renderGallery(adsData, "All ads");
    }
  }
}

// Export functions for use in other modules
export { 
  initializeGallery, 
  updateGallery,
  resetFilters  // Add this
};

// Add this at the end of the file
window.updateGallery = updateGallery;