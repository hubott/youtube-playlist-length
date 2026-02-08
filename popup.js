// List of setting keys
const SETTINGS = ['remainingTime', 'speedTimes', 'darkTheme', 'finishesAt'];

// Initialize checkboxes from storage when popup opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(SETTINGS, (result) => {
    SETTINGS.forEach(id => {
      const checkbox = document.getElementById(id);
      // default to true if not set
      checkbox.checked = result[id] !== undefined ? result[id] : true;
    });
  });

  // Add change listener to save immediately
  SETTINGS.forEach(id => {
    const checkbox = document.getElementById(id);
    checkbox.addEventListener('change', (e) => {
      const obj = {};
      obj[id] = e.target.checked;
      chrome.storage.local.set(obj);
    });
  });
});
