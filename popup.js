document.addEventListener('DOMContentLoaded', function() {
    const reminderInput = document.getElementById('reminderInput');
    const addReminderBtn = document.getElementById('addReminder');
    const reminderList = document.getElementById('reminderList');
  
    // Get current website
    function getCurrentWebsite() {
      return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          const url = new URL(tabs[0].url);
          resolve(url.hostname);
        });
      });
    }
  
    // Load existing reminders
    async function loadReminders() {
      const website = await getCurrentWebsite();
      chrome.storage.sync.get([website], function(result) {
        const reminders = result[website] || [];
        reminderList.innerHTML = '';
        reminders.forEach((reminder, index) => {
          const reminderItem = document.createElement('div');
          reminderItem.className = 'reminder-item';
          reminderItem.innerHTML = `
            <span>${reminder}</span>
            <button class="delete-reminder" data-index="${index}">Delete</button>
          `;
          reminderList.appendChild(reminderItem);
        });
  
        // Add delete functionality
        document.querySelectorAll('.delete-reminder').forEach(button => {
          button.addEventListener('click', async function() {
            const index = this.getAttribute('data-index');
            const website = await getCurrentWebsite();
            
            chrome.storage.sync.get([website], function(result) {
              const reminders = result[website] || [];
              reminders.splice(index, 1);
              
              chrome.storage.sync.set({[website]: reminders}, function() {
                loadReminders();
              });
            });
          });
        });
      });
    }
  
    // Add new reminder
    addReminderBtn.addEventListener('click', async function() {
      const reminder = reminderInput.value.trim();
      if (reminder) {
        const website = await getCurrentWebsite();
        
        chrome.storage.sync.get([website], function(result) {
          const reminders = result[website] || [];
          reminders.push(reminder);
          
          chrome.storage.sync.set({[website]: reminders}, function() {
            reminderInput.value = '';
            loadReminders();
          });
        });
      }
    });
  
    // Load reminders when popup opens
    loadReminders();
  });
