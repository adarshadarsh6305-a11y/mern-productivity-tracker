chrome.tabs.onUpdated.addListener(
  async (tabId, changeInfo, tab) => {

    if (changeInfo.status !== "complete" || !tab.url)
      return;

    try {

      const domain = new URL(tab.url).hostname;

      const res = await fetch(
        "http://localhost:5000/blocked-sites"
      );

      const blockedSites = await res.json();

      const isBlocked = blockedSites.some(site =>
        domain.includes(site.website)
      );

      console.log("Current:", domain);
      console.log("Blocked:", isBlocked);

      if (isBlocked) {

        chrome.tabs.update(tabId, {
          url: chrome.runtime.getURL(
            "blocked.html"
          )
        });

      }

    } catch (err) {
      console.log(err);
    }
  }
);