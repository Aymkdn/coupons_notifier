// Note: the changes on this page requires an extension refresh while developing it
// console.log("content.js");

// check if we have coupon info for this website
chrome.storage.local.get("coupons")
.then(async data => {
  if (Array.isArray(data.coupons)) {
    let notes = [];
    let uri = window.location.href.toLowerCase();
    data.coupons.forEach(coupon => {
      if (uri===coupon.url || uri.startsWith(coupon.url+"/")) {
        notes.push(coupon.notes.replace(/\n/g, "<br>"));
      }
    })

    // if we have coupons associated to the current page
    if (notes.length>0) {
      // inject script
      let s = document.createElement('script');
      s.id = "coupon_notifier_addon";
      s.src = chrome.runtime.getURL('injected.js');
      s.onload = function () {
        this.remove();
      };
      let area = (document.head || document.documentElement);
      area.appendChild(s);

      // save the icon in the page to use it
      let i = document.createElement('img');
      i.src = chrome.runtime.getURL("logo.png");
      i.id  = "coupon_notifier_icon";
      i.width = "44";
      i.height = "44";
      area.appendChild(i);

      // send the notes to the injected.js
      window.postMessage(`coupon_notifier_badge_details:${notes.join("#@#")}`, "*");

      // send the translation to injected.js
      window.postMessage(`coupon_notifier_badge_translation_title:${browser.i18n.getMessage('badge_title')}`);
    }
  }
})

