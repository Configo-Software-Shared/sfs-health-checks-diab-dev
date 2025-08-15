/**
 * Manages a tabbed details view system with configurable content generation and data table initialization.
 * This function handles the creation, display, and management of detail tabs.
 *
 * @param {Object} config - Configuration object for the tab system
 * @param {string} config.containerId - ID of the container element for tabs
 * @param {string} config.menuId - ID of the tab menu element
 * @param {string} config.currentTabId - ID of the current/default tab
 * @param {string} config.currentMenuItemId - ID of the current menu item
 * @param {Function} config.generateContent - Function to generate HTML content for a tab
 * @param {Function} config.initializeContent - Function to initialize content in a tab, such as initializing DataTables
 * @param {Function} config.cleanupContent - Function to cleanup content in a tab, such as destroying DataTables
 * @param {Function} config.getTabId - Function to generate unique tab IDs
 * @param {Function} config.findData - Function to find data for a given identifier
 * @param {string} config.notFoundMessage - Message to display when data is not found
 * @param {boolean} config.enableCloseButtons - Whether to add close buttons to tabs
 * @param {string} config.closeButtonClass - CSS class for close buttons
 */
function createTabbedDetailsManager(config) {
  const {
    containerId = "details",
    menuId = "tab-menu",
    currentTabId = "tab-current",
    currentMenuItemId = "tab-menu-current",
    generateContent,
    initializeContent,
    cleanupContent,
    getTabId,
    findData,
    notFoundMessage = "Item not found.",
    enableCloseButtons = true,
    closeButtonClass = "close icon",
  } = config;

  /**
   * Displays details in the current tab without creating a new tab.
   * @param {string} identifier - The identifier for the item to display
   * @param {boolean} scrollIntoView - Whether to scroll the tab menu into view
   */
  function displayDetails(identifier, scrollIntoView = false) {
    const existingTab = document.getElementById(getTabId(identifier));
    if (existingTab !== null) {
      existingTab.click();
      if (scrollIntoView) {
        existingTab.scrollIntoView();
      }
      return;
    }

    const data = findData(identifier);
    if (data) {
      // Cleanup existing DataTables if needed
      if (cleanupContent) {
        cleanupContent(currentTabId);
      }

      const content = generateContent(currentTabId, data);
      document.getElementById(currentTabId).innerHTML = content;

      // Initialize DataTables if needed
      if (initializeContent) {
        initializeContent(currentTabId, data);
      }

      // Update menu item text
      const menuItem = document.getElementById(currentMenuItemId);
      menuItem.innerHTML = `<i>${identifier}</i>`;
      menuItem.click();
    } else {
      document.getElementById(currentTabId).innerHTML =
        `<div class="ui negative message">${notFoundMessage.replace("{identifier}", identifier)}</div>`;
    }

    if (scrollIntoView) {
      document.getElementById(menuId).scrollIntoView();
    }
  }

  /**
   * Creates a new tab and displays details in it.
   * @param {string} identifier - The identifier for the item to display
   * @param {boolean} showTab - Whether to activate the new tab
   * @param {boolean} scrollIntoView - Whether to scroll the tab menu into view
   */
  function addAndDisplayDetails(
    identifier,
    showTab = false,
    scrollIntoView = false
  ) {
    let objTab = document.getElementById(getTabId(identifier));
    let tabContent = document.querySelector(`[data-tab="${identifier}"]`);

    // Clean up orphaned content if tab doesn't exist but content does
    if (objTab === null && tabContent !== null) {
      tabContent.remove();
      tabContent = null;
    }

    if (objTab === null) {
      // Create new tab and content
      const newTabDetail = document.createElement("div");
      newTabDetail.setAttribute("class", "ui bottom attached tab segment");
      newTabDetail.setAttribute("data-tab", identifier);
      document.getElementById(containerId).appendChild(newTabDetail);

      objTab = document.createElement("a");
      objTab.setAttribute("id", getTabId(identifier));
      objTab.setAttribute("class", "item");
      objTab.setAttribute("data-tab", identifier);

      const closeButton =
        enableCloseButtons ?
          `<i class="${closeButtonClass}" onclick="closeTab('${identifier}', event)" style="margin-left: 0.5em; margin-right:-0.3em;"></i>`
        : "";
      objTab.innerHTML = `${identifier} ${closeButton}`;

      document.getElementById(menuId).appendChild(objTab);
      tabContent = newTabDetail;
      $(".menu .item").tab({
        onVisible: initializeContent,
      });

      // Populate the content
      const data = findData(identifier);
      if (data && tabContent) {
        // Cleanup existing DataTables if needed
        if (cleanupContent) {
          cleanupContent(getTabId(identifier));
        }

        tabContent.innerHTML = generateContent(getTabId(identifier), data);
      } else if (tabContent) {
        tabContent.innerHTML = `<div class="ui negative message">${notFoundMessage.replace("{identifier}", identifier)}</div>`;
      }
    }

    if (showTab) {
      objTab.click();
    }

    if (scrollIntoView) {
      document.getElementById(menuId).scrollIntoView();
    }
  }

  /**
   * Closes a tab and cleans up associated resources.
   * @param {string} identifier - The identifier of the tab to close
   * @param {Event} event - The click event
   */
  function closeTab(identifier, event) {
    event.stopPropagation(); // Prevent tab activation when clicking close button

    const tabElement = document.getElementById(getTabId(identifier));
    const tabContent = document.querySelector(`[data-tab="${identifier}"]`);

    if (tabElement && tabContent) {
      // Cleanup DataTables before removing DOM elements
      if (cleanupContent) {
        cleanupContent(getTabId(identifier));
      }

      // Remove tab and content
      tabElement.remove();
      tabContent.remove();

      // If the closed tab was active, switch to the first tab
      if (tabElement.classList.contains("active")) {
        document.getElementById(currentMenuItemId).click();
      }

      // Reinitialize tabs
      $(".menu .item").tab();
    }
  }

  return {
    displayDetails,
    addAndDisplayDetails,
    closeTab,
  };
}

/**
 * Sets up click handlers for a master table to trigger detail views.
 * @param {string} tableSelector - Selector for the master table
 * @param {Function} getIdentifier - Function to extract identifier from clicked row
 * @param {Function} displayDetails - Function to display details (single click)
 * @param {Function} addAndDisplayDetails - Function to add and display details (double click)
 * @param {number} clickDelay - Delay in ms for single click detection
 */
function setupMasterTableClickHandlers(
  tableSelector,
  getIdentifier,
  displayDetails,
  addAndDisplayDetails,
  clickDelay = 300
) {
  let clickTimer = null;

  $(tableSelector + " tbody").on("click", "tr", function () {
    const identifier = getIdentifier($(this));
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      // Do nothing here; dblclick will handle
    } else {
      clickTimer = setTimeout(() => {
        displayDetails(identifier); // single-click
        clickTimer = null;
      }, clickDelay);
    }
  });

  $(tableSelector + " tbody").on("dblclick", "tr", function (e) {
    e.preventDefault();
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
    const identifier = getIdentifier($(this));
    addAndDisplayDetails(identifier, true, false); // double-click
  });
}
