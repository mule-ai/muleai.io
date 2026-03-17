/**
 * Mule AI Blog - Custom JavaScript
 * Adds scroll progress bar, back-to-top button, and enhanced interactions
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    initScrollProgressBar();
    initBackToTop();
    initSearchEnhancements();
  });

  /**
   * Scroll Progress Bar
   * Shows a progress bar at the top of the page as user scrolls
   */
  function initScrollProgressBar() {
    // Only show on blog posts/pages, not on homepage
    if (!document.querySelector('.blog-post') && !document.querySelector('article')) {
      return;
    }

    // Create the progress bar element
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress-bar';
    document.body.appendChild(progressBar);

    // Update width on scroll
    window.addEventListener('scroll', function() {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      if (documentHeight > 0) {
        const progress = (scrollTop / documentHeight) * 100;
        progressBar.style.width = progress + '%';
      }
    }, { passive: true });
  }

  /**
   * Back to Top Button
   * Floating button that appears when user scrolls down
   */
  function initBackToTop() {
    // Create the button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.setAttribute('aria-label', 'Back to top');
    backToTopBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    `;
    document.body.appendChild(backToTopBtn);

    // Show/hide based on scroll position
    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    // Scroll to top on click
    backToTopBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /**
   * Search Enhancements
   * Add keyboard shortcut hints and focus states
   */
  function initSearchEnhancements() {
    const searchInputs = document.querySelectorAll('input[type="search"], input[type="text"]');
    
    searchInputs.forEach(function(input) {
      // Check if this looks like a search input
      const placeholder = input.getAttribute('placeholder') || '';
      const parent = input.closest('.search-container');
      
      if (parent || placeholder.toLowerCase().includes('search')) {
        // Add keyboard hint (Cmd/Ctrl + K)
        if (!input.closest('.search-container')?.querySelector('.keyboard-hint')) {
          const searchWrapper = document.createElement('div');
          searchWrapper.className = 'search-container';
          
          // Wrap input in container if not already
          if (!input.parentElement.classList.contains('search-input-wrapper')) {
            const inputWrapper = document.createElement('div');
            inputWrapper.className = 'search-input-wrapper';
            input.parentNode.insertBefore(inputWrapper, input);
            inputWrapper.appendChild(input);
            
            // Add search icon
            const icon = document.createElement('span');
            icon.className = 'search-icon';
            icon.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            `;
            inputWrapper.appendChild(icon);
          }
        }
      }
    });

    // Global keyboard shortcut for search (Cmd/Ctrl + K)
    document.addEventListener('keydown', function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        
        // Find search input and focus it
        const searchInput = document.querySelector('input[type="search"], input[type="text"]');
        if (searchInput) {
          searchInput.focus();
        }
      }
    });
  }

})();
