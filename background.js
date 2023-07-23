console.log("########## background.js");
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    browser.tabs.executeScript(tabId, {
      file: "content.js"
    });
  }
});
