//browser.permissions.getAll().then(console.log);
// check if we have permissions for all websites
browser.permissions.contains({
  origins:["<all_urls>"],
  permissions:["scripting"]
}).then(ret => {
  if (!ret) {
    // show a message to ask to get access
    const accessDiv = document.querySelector('#need_access');
    if (accessDiv) accessDiv.classList.add("show");
  }
})

// set the text up
const needTextElements = document.querySelectorAll(".need_text");
for (let i=0; i<needTextElements.length; i++) {
  if (needTextElements[i].id) {
    let txt = browser.i18n.getMessage(needTextElements[i].id);
    needTextElements[i].innerHTML = txt;
  }
}

// the popup elements
const addUrlElem = document.querySelector("#add_url");
const addNotesElem = document.querySelector("#add_notes");
const qtyCouponsElem = document.querySelector("#qty_coupons");
const listCouponsElem = document.querySelector("#list_coupons");
const requestAccessElem = document.querySelector("#request_access");
const btnExportElem = document.querySelector("#btn_export");
const btnImportElement = document.querySelector("#btn_import");
const btnAddElem = document.querySelector("#btn_add");
const btnRemoveElem = document.querySelector("#btn_remove");

// add event to the request access button
requestAccessElem.addEventListener("click", function() {
  browser.permissions.request({
    origins:["<all_urls>"],
    permissions:["scripting"]
  })
})

// button to add a coupon
btnAddElem.addEventListener("click", () => {
  // save the info
  if (!addUrlElem.value || !addNotesElem.value) {
    alert(browser.i18n.getMessage("error_missing_values"))
  } else {
    // save the info locally
    getCoupons()
    .then(coupons => {
      let uri = addUrlElem.value.toLowerCase();
      let param = {
        url:uri,
        notes:addNotesElem.value
      }
      // check if this record already exists
      let couponIndex = coupons.findIndex(obj => obj.url === uri);
      if (couponIndex>-1) {
        coupons.splice(couponIndex, 1, param);
      } else {
        coupons.push(param);
      }

      chrome.storage.local.set({coupons:coupons})
      .then(() => {
        alert(browser.i18n.getMessage("confirm_add"));
        updateListOfCoupons();
      })
    })
  }
})

// button to delete a coupon
btnRemoveElem.addEventListener("click", () => {
  if (!addUrlElem.value) {
    alert(browser.i18n.getMessage("error_missing_url"))
  } else {
    // save locally the info
    chrome.storage.local.get("coupons")
    .then(data => {
      let uri = addUrlElem.value;
      let coupons = data.coupons || [];
      let couponIndex = coupons.findIndex(obj => obj.url === uri);
      if (couponIndex>-1) {
        coupons.splice(couponIndex, 1);
        chrome.storage.local.set({coupons:coupons})
        .then(() => {
          addNotesElem.value = "";
          alert(browser.i18n.getMessage("confirm_remove"));
          updateListOfCoupons();
        });
      }
    })
  }
})

// button to export
btnExportElem.addEventListener("click", () => {
  getCoupons()
  .then(coupons => {
    // Convert the JSON data to a string
    const jsonString = JSON.stringify(coupons);

    // Create a Blob with the JSON string
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create an anchor element and trigger a download
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = "coupons_notifier.json";
    downloadLink.click();

    // Revoke the object URL to free up memory
    URL.revokeObjectURL(downloadLink.href);
  })  
})

// button to import
btnImportElement.addEventListener("click", () => {
  // show a warning message first
  //alert(browser.i18n.getMessage("import_warning"));
  browser.tabs.create({ url: 'import.html' });
});

function getCouponsForURL(url) {
  // set the default for the "add_url" field
  addUrlElem.value = url;

  // retrieve local data
  getCoupons()
  .then(coupons => {
    let notesCurrentSite = coupons.find(obj => obj.url === url);
    if (notesCurrentSite) {
      addNotesElem.value = notesCurrentSite.notes;
    }
  })
}

// return a Promise with an array of {url, notes}
function getCoupons () {
  return chrome.storage.local.get("coupons")
  .then(data => data.coupons || [])
}

function updateListOfCoupons () {
  getCoupons()
  .then(coupons => {
    qtyCouponsElem.innerHTML = `(${coupons.length})`;
    // sort by URL
    coupons.sort((a,b) => a.url.localeCompare(b.url, 'en', { sensitivity: 'base' }));
    listCouponsElem.innerHTML = coupons.map(coupon => {
      return `<li>${coupon.url} <button class="btn_view" type="button" data-url="${coupon.url}">${browser.i18n.getMessage("btn_view")}</button></li>`;
    }).join("");

    // associate the event
    document.querySelectorAll('button[data-url]').forEach(btn => {
      btn.addEventListener("click", function() {
        // open the url in a new tab
        browser.tabs.create({ url:btn.dataset.url });
        getCouponsForURL(btn.dataset.url);
      })
    });

    // show/hide the export button 
    btnExportElem.style.display = (coupons.length>0 ? "inline" : "none");
  })
}

// initiate
// find current tab URL
browser.tabs
.query({ currentWindow: true, active: true })
.then(res => {
  let mainUrl = "";
  if (Array.isArray(res) && res.length>0) {
    // only keep the first part of the URL
    mainUrl = res[0].url.split("/").slice(0,3).join("/");
    getCouponsForURL(mainUrl);
  }
});
// get a list of coupons for other websites
updateListOfCoupons();

// list for messages from "content.js"
browser.runtime.onMessage.addListener(function(message) {
  console.log(message.greeting); // Output the received message
});

// retrieve existing entries
// toggle visibility
// btnAddElem.classList.replace("show-it-hide-next", "hide-it-show-next");
/*
// Initialize the form with the user's option settings
chrome.storage.local.get("replace_calendar_sound")
.then(data => {
  if (data.replace_calendar_sound) {
    let el = document.querySelector('input[name="replace_calendar_sound"]');
    if (el) el.checked=true;
  }
});
chrome.storage.local.get("activate_calendar_notification")
.then(data => {
  if (data.activate_calendar_notification) {
    let el = document.querySelector('input[name="activate_calendar_notification"]');
    if (el) el.checked=true;
  }
});
chrome.storage.local.get("replace_email_sound")
.then(data => {
  if (data.replace_email_sound) {
    let el = document.querySelector('input[name="replace_email_sound"]');
    if (el) el.checked=true;
  }
});

// convert an array buffer to a base64 string
function arrayBufferToBase64(buffer) {
  let binary = '';
  let bytes = new Uint8Array(buffer);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Below is a function that converts a base64 string to an ArrayBuffer
function base64ToArrayBuffer(base64String) {
  const binaryString = atob(base64String);
  const arrayBuffer = new ArrayBuffer(binaryString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  return arrayBuffer;
}

// manage the toggle switch buttons
const toggleSwitch = document.querySelectorAll(".switch input[type='checkbox']");
for (let el of toggleSwitch) {
  el.addEventListener("change", function() {
    // save the selection
    let option = {};
    option[el.name] = this.checked;
    chrome.storage.local.set(option);
  });
}

function loadCalendarAudio (arrayBuffer) {
  let el = document.querySelector('#file_calendar');
  if (el) {
    const audioElement = document.createElement('audio');
    audioElement.src = URL.createObjectURL(new Blob([arrayBuffer], { type: 'audio/mpeg' }));
    audioElement.controls = true;
    el.insertAdjacentElement('afterend', audioElement);
  }
}

// retrieve if we already have a stored sound for calendar reminder
chrome.storage.local.get("file_calendar")
.then(data => {
  if (data.file_calendar) {
    loadCalendarAudio(base64ToArrayBuffer(data.file_calendar));
  }
})

// when a file is loaded, locally save it
const fileCalendar = document.querySelector('#file_calendar');
if (fileCalendar) {
  fileCalendar.addEventListener("change", function() {
    const file = fileCalendar.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
      let arrayBuffer = event.target.result;
      chrome.storage.local.set({"file_calendar":arrayBufferToBase64(arrayBuffer)});
      loadCalendarAudio(arrayBuffer);
    }

    reader.readAsArrayBuffer(file);
  });
}

function loadNewEmailAudio (arrayBuffer) {
  let el = document.querySelector('#file_email');
  if (el) {
    const audioElement = document.createElement('audio');
    audioElement.src = URL.createObjectURL(new Blob([arrayBuffer], { type: 'audio/mpeg' }));
    audioElement.controls = true;
    el.insertAdjacentElement('afterend', audioElement);
  }
}

// retrieve if we already have a stored sound for new email
chrome.storage.local.get("file_email")
.then(data => {
  if (data.file_email) {
    loadNewEmailAudio(base64ToArrayBuffer(data.file_email));
  }
})

// when a file is loaded, locally save it
const fileNewEmail = document.querySelector('#file_email');
if (fileNewEmail) {
  fileNewEmail.addEventListener("change", function() {
    const file = fileNewEmail.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
      let arrayBuffer = event.target.result;
      chrome.storage.local.set({"file_email":arrayBufferToBase64(arrayBuffer)});
      loadNewEmailAudio(arrayBuffer);
    }

    reader.readAsArrayBuffer(file);
  });
}

// if we want to remove a sound
const deleteBtn = document.querySelectorAll(".delete");
for (let elem of deleteBtn) {
  elem.addEventListener("click", function() {
    let target = elem.dataset.target;
    let param = {};
    param["file_"+target] = "";
    chrome.storage.local.set(param);
    let el = document.querySelector('#file_'+target+' + audio');
    if (el) el.parentNode.removeChild(el);
    el = document.querySelector('#file_'+target);
    if (el) el.value="";
  });
}
*/
