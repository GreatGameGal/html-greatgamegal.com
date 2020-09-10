const storageOpts = [
  ["gameStorage", "Game Data Storage"],
  ["mandelbrotStorage", "Mandelbrot Setting Storage"],
];

function createPreferenceBox(parent, labelText, id) {
  const labelEl = document.createElement("label");
  labelEl.className = "container";
  labelEl.append(labelText);
  const checkBoxEl = document.createElement("input");
  checkBoxEl.type = "checkbox";
  checkBoxEl.id = id;
  if (localStorage.prefs)
    checkBoxEl.checked = JSON.parse(localStorage.prefs)["storage"][id] || false;
  labelEl.append(checkBoxEl);
  const checkmarkEl = document.createElement("span");
  checkmarkEl.className = "checkmark";
  labelEl.appendChild(checkmarkEl);
  parent.appendChild(labelEl);
  return {
    label: labelEl,
    checkbox: checkBoxEl,
  };
}

let checkboxes = [];

window.addEventListener("load", () => {
  const prefStoreEl = document.getElementById("preferenceStorage");
  prefStoreEl.checked = Boolean(localStorage.prefs);

  prefStoreEl.addEventListener("change", (e) => {
    if (e.target.checked) {
      localStorage.setItem("prefs", JSON.stringify({ storage: {} }));
      for (let box of checkboxes) {
        box.checkbox.disabled = false;
        box.label.classList.remove("disabled");
      }
    } else {
      localStorage.removeItem("prefs");
      for (let box of checkboxes) {
        box.checkbox.disabled = true;
        box.label.classList.add("disabled");
      }
    }
  });

  const storageOptsDiv = document.getElementById("storageOptions");
  for (let opt of storageOpts) {
    const box = createPreferenceBox(storageOptsDiv, opt[1], opt[0]);
    box.checkbox.disabled = !prefStoreEl.checked;
    if (!prefStoreEl.checked) {
      box.label.classList.add("disabled");
    }
    box.checkbox.addEventListener("change", (e) => {
      const prefs = JSON.parse(localStorage.prefs);
      prefs.storage[e.target.id] = e.target.checked;
      localStorage.setItem("prefs", JSON.stringify(prefs));
      if (!e.target.checked) localStorage.removeItem(e.target.id)
    });
    checkboxes.push(box);
  }
});
