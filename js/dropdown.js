// Add this to your main.js or a separate dropdown.js file
document.addEventListener('DOMContentLoaded', function() {
    // Convert select elements to custom dropdowns
    document.querySelectorAll('.filter-select').forEach(select => {
      createCustomDropdown(select);
    });
    
    function createCustomDropdown(select) {
      // Create wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'custom-dropdown';
      select.parentNode.insertBefore(wrapper, select);
      
      // Create selected display
      const selected = document.createElement('div');
      selected.className = 'custom-dropdown-selected';
      selected.textContent = select.options[select.selectedIndex].text;
      wrapper.appendChild(selected);
      
      // Create options container
      const optionsContainer = document.createElement('div');
      optionsContainer.className = 'custom-dropdown-options';
      wrapper.appendChild(optionsContainer);
      
      // Add options
      Array.from(select.options).forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = 'custom-dropdown-option with-check';
        optionElement.dataset.value = option.value;
        optionElement.textContent = option.text;
        if (option.selected) optionElement.classList.add('selected');
        
        optionElement.addEventListener('click', () => {
          // Update selected value
          selected.textContent = optionElement.textContent;
          select.value = optionElement.dataset.value;
          
          // Update selected class
          optionsContainer.querySelectorAll('.custom-dropdown-option').forEach(opt => {
            opt.classList.toggle('selected', opt === optionElement);
          });
          
          // Close dropdown
          wrapper.classList.remove('open');
          
          // Trigger change event on original select
          select.dispatchEvent(new Event('change'));
        });
        
        optionsContainer.appendChild(optionElement);
      });
      
      // Toggle dropdown on click
      selected.addEventListener('click', (e) => {
        e.stopPropagation();
        wrapper.classList.toggle('open');
      });
      
      // Close when clicking outside
      document.addEventListener('click', () => {
        wrapper.classList.remove('open');
      });
      
      // Hide original select
      select.style.display = 'none';
    }
  });