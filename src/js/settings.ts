const storageOpts = [
  [ "gameStorage", "Game Data Storage" ],
  [ "mandelbrotStorage", "Mandelbrot Setting Storage" ],
];

function createPreferenceBox (
  parent: HTMLElement,
  labelText: string,
  id: string
) {
  const labelEl = document.createElement("label");
  labelEl.className = "container";
  labelEl.append(labelText);
  const checkBoxEl = document.createElement("input");
  checkBoxEl.type = "checkbox";
  checkBoxEl.id = id;
  if (localStorage.prefs !== undefined)
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

const checkboxes: Array<{
  label: HTMLLabelElement;
  checkbox: HTMLInputElement;
}> = [];

window.addEventListener("load", () => {
  const prefStoreEl = <HTMLInputElement>(
    document.getElementById("preferenceStorage")
  );
  if (prefStoreEl == null)
    return;
  prefStoreEl.checked = localStorage.prefs !== undefined;

  prefStoreEl.addEventListener("change", (e) => {
    const target = <HTMLInputElement>e.target;
    if (
      target !== undefined &&
      target.checked !== undefined &&
      target.checked
    ) {
      localStorage.setItem("prefs", JSON.stringify({ storage: {} }));
      for (const box of checkboxes) {
        box.checkbox.disabled = false;
        box.label.classList.remove("disabled");
      }
    } else {
      localStorage.removeItem("prefs");
      for (const box of checkboxes) {
        box.checkbox.disabled = true;
        box.label.classList.add("disabled");
      }
    }
  });

  const storageOptsDiv = document.getElementById("storageOptions");
  if (storageOptsDiv === null)
    return;
  for (const opt of storageOpts) {
    const box = createPreferenceBox(storageOptsDiv, opt[1], opt[0]);
    box.checkbox.disabled = !prefStoreEl.checked;
    if (!prefStoreEl.checked)
      box.label.classList.add("disabled");

    box.checkbox.addEventListener("change", (e) => {
      const target = <HTMLInputElement>e.target;
      if (target == null || target.checked == null)
        return;
      const prefs = JSON.parse(localStorage.prefs);
      prefs.storage[target.id] = target.checked;
      localStorage.setItem("prefs", JSON.stringify(prefs));
      if (!target.checked)
        localStorage.removeItem(target.id);
    });
    checkboxes.push(box);
  }
});
