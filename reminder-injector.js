const processedTabs = new Set();

chrome.tabs.onCreated.addListener(function(tab) {
    
    if (tab.url === "" || tab.url === "chrome://newtab/") {

        // If the tab doesn't have a URL, wait for it to be updated with one
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, updatedTab) {
            if (tabId === tab.id && changeInfo.url && updatedTab.url !== "chrome://newtab/") {
                console.log("Handling tab change to a valid URL");
                
                // When the tab gets a valid URL, handle it
                handleTab(updatedTab);
                
                // Clean up the listener after the tab is processed
                chrome.tabs.onUpdated.removeListener(listener);
            }
        });
    } else {
        // If the tab already has a URL, handle it immediately
        handleTab(tab);
    }
});
function handleTab(tab) {
    if (tab.url && !processedTabs.has(tab.id)) {
        const url = new URL(tab.url);

        // Mark this tab as processed
        processedTabs.add(tab.id);

        console.log('Running script for the first time on tab:', tab.id, 'URL:', url.href);

        chrome.storage.sync.get([url.hostname], function(result) {

            console.log("syncing");
            const reminders = result[url.hostname] || [];

            console.log(url.hostname);
            
            if (reminders.length > 0) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (reminders, hostname) => {
                        if (document.getElementById('website-reminders-overlay')) return;

                        const overlay = document.createElement('div');
                        overlay.id = 'website-reminders-overlay';
                        overlay.style.cssText = `
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0,0,0,0.3);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            z-index: 100000;
                        `;

                        const modal = document.createElement('div');
                        modal.id = 'website-reminders-modal';
                        modal.style.cssText = `
                            background-color: white;
                            border-radius: 12px;
                            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                            padding: 25px;
                            max-width: 400px;
                            width: 90%;
                            text-align: center;
                            position: relative;
                            animation: fadeIn 0.3s ease-out;
                        `;

                        const styleSheet = document.createElement('style');
                        styleSheet.textContent = `
                            @keyframes fadeIn {
                                from { opacity: 0; transform: scale(0.9); }
                                to { opacity: 1; transform: scale(1); }
                            }
                        `;
                        document.head.appendChild(styleSheet);

                        const title = document.createElement('h2');
                        title.textContent = 'Saved Reminders';
                        title.style.marginBottom = '20px';
                        title.style.color = '#333';
                        modal.appendChild(title);

                        const reminderContainer = document.createElement('div');
                        reminderContainer.style.maxHeight = '300px';
                        reminderContainer.style.overflowY = 'auto';
                        reminderContainer.style.marginBottom = '20px';

                        reminders.forEach((reminder, index) => {
                            const reminderElement = document.createElement('div');
                            reminderElement.textContent = reminder;
                            reminderElement.style.cssText = `
                                background-color: #f4f4f4;
                                padding: 10px;
                                margin: 10px 0;
                                border-radius: 6px;
                                color: #333;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                            `;
                            
                            const removeButton = document.createElement('button');
                            removeButton.textContent = 'Remove';
                            removeButton.style.cssText = `
                                background-color: #e74c3c;
                                color: white;
                                border: none;
                                padding: 5px 10px;
                                border-radius: 6px;
                                cursor: pointer;
                                transition: background-color 0.3s ease;
                            `;
                            
                            removeButton.addEventListener('click', () => {
                                // Remove the reminder from the array
                                reminders.splice(index, 1);

                                // Update the storage
                                chrome.storage.sync.set({ [hostname]: reminders }, function() {
                                    console.log("Reminder removed from storage");

                                    // Re-run the script to update the modal
                                    document.body.removeChild(overlay);
                                    handleTab({ url: window.location.href }); // Re-trigger handling
                                });
                            });

                            removeButton.addEventListener('mouseenter', () => {
                                removeButton.style.backgroundColor = '#c0392b';
                            });

                            removeButton.addEventListener('mouseleave', () => {
                                removeButton.style.backgroundColor = '#e74c3c';
                            });

                            reminderElement.appendChild(removeButton);
                            reminderContainer.appendChild(reminderElement);
                        });

                        modal.appendChild(reminderContainer);

                        const closeButton = document.createElement('button');
                        closeButton.textContent = 'Close';
                        closeButton.style.cssText = `
                            background-color: #4a90e2;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            transition: background-color 0.3s ease;
                        `;

                        closeButton.addEventListener('click', () => {
                            document.body.removeChild(overlay);
                        });

                        closeButton.addEventListener('mouseenter', () => {
                            closeButton.style.backgroundColor = '#3a7bd5';
                        });

                        closeButton.addEventListener('mouseleave', () => {
                            closeButton.style.backgroundColor = '#4a90e2';
                        });

                        modal.appendChild(closeButton);
                        overlay.appendChild(modal);

                        overlay.addEventListener('click', (event) => {
                            if (event.target === overlay) {
                                document.body.removeChild(overlay);
                            }
                        });

                        document.body.appendChild(overlay);
                    },
                    args: [reminders, url.hostname]
                });
            }
        });
    }
}
