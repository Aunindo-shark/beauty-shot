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
      // Send the selected text to the content script in the active tab
      chrome.tabs.sendMessage(tab.id, {
        action: "generateBeautyShot",
        text: selectedText
      }).catch(err => {
        console.error("Could not send message. Content script may not be loaded yet.", err);
        // Optionally, inject the content script dynamically using chrome.scripting.executeScript
      });
    }
  }
});
