chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generate-beauty-shot",
    title: "Generate Beauty Shot",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generate-beauty-shot") {
    const selectedText = info.selectionText;
    
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: "generateBeautyShot",
        text: selectedText
      }).catch(err => {
        console.warn("Content script not loaded. Injecting dynamically...", err);
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["highlight.min.js", "content.js"]
        }).then(() => {
          // Retry sending message after injection
          chrome.tabs.sendMessage(tab.id, {
            action: "generateBeautyShot",
            text: selectedText
          });
        }).catch(injectErr => {
          console.error("Failed to inject content script:", injectErr);
        });
      });
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreen') {
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
      sendResponse({dataUrl});
    });
    return true; // Keep the message channel open for async response
  }
});
