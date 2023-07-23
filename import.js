// set the text up
const needTextElements = document.querySelectorAll(".need_text");
for (let i=0; i<needTextElements.length; i++) {
  if (needTextElements[i].id) {
    let txt = browser.i18n.getMessage(needTextElements[i].id);
    needTextElements[i].innerHTML = txt;
  }
}

const importFileElem = document.querySelector("#import_file");
const btnImportElem = document.querySelector("#btn_import");
var dataToImport = [];

// when clicking on the input file
importFileElem.addEventListener("change", event => {
  const selectedFile = event.target.files[0];
  const fileReader = new FileReader();

  fileReader.onload = (e) => {
    const fileContent = e.target.result;
    dataToImport = JSON.parse(fileContent);
    btnImportElem.disabled = false;
  };

  fileReader.readAsText(selectedFile);
});

btnImportElem.addEventListener("click", () => {
  if (dataToImport.length>0) {
    chrome.storage.local.set({coupons:dataToImport})
    .then(() => {
      alert(browser.i18n.getMessage("import_confirm"));
    })
  }
})
