import { analyze, categories, examples } from "./engine.mjs";

const get = (id) => document.getElementById(id);
const key = "scamlens-checks-v1";
const storage = {
  read() {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return Array.isArray(data)
        ? data.filter((item) => Array.isArray(item?.report?.flags))
        : [];
    } catch {
      return [];
    }
  },
  write(items) {
    localStorage.setItem(key, JSON.stringify(items));
  },
};
const add = (parent, tag, content, className) => {
  const element = document.createElement(tag);
  element.textContent = content;
  if (className) element.className = className;
  parent.append(element);
  return element;
};
function show(report) {
  const results = get("results");
  results.replaceChildren();
  add(results, "p", report.level, "score");
  add(
    results,
    "p",
    `Signal score ${report.score}/100 · ${report.flags.length} matched · ${categories[report.category]}`,
  );
  add(
    results,
    "small",
    "The score is a sum of rule weights. Independently verify the listing even if the score is zero.",
  );
  for (const flag of report.flags) {
    const section = add(results, "div", "", "flag");
    add(section, "strong", flag.title);
    add(section, "blockquote", `“${flag.evidence}”`);
    add(section, "p", flag.action);
  }
  add(results, "p", report.nextStep);
  const download = add(results, "button", "Download report (JSON)", "link");
  download.addEventListener("click", () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "scamlens-report.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
function history() {
  const list = get("history");
  list.replaceChildren();
  const items = storage.read();
  get("clear").hidden = !items.length;
  if (!items.length) list.textContent = "No saved checks on this device.";
  for (const { report, date } of items) {
    const label = `${categories[report.category]} · ${report.score}/100 · ${new Date(date).toLocaleString()}`;
    add(list, "button", label, "link saved").addEventListener("click", () => {
      show(report);
      get("result-title").scrollIntoView({ block: "center" });
    });
  }
}
get("example").addEventListener("click", () => {
  get("listing").value = examples[get("category").value];
  get("listing").focus();
});
get("scan").addEventListener("submit", (event) => {
  event.preventDefault();
  get("status").textContent = "";
  try {
    const report = analyze(get("listing").value, get("category").value);
    show(report);
    if (get("save").checked) {
      storage.write(
        [{ report, date: Date.now() }, ...storage.read()].slice(0, 20),
      );
      history();
    }
  } catch (error) {
    get("status").textContent =
      error.name === "QuotaExceededError"
        ? "Device storage is full. Clear saved checks and try again."
        : error.message;
  }
});
get("clear").addEventListener("click", () => {
  if (!confirm("Clear saved checks on this device?")) return;
  try {
    localStorage.removeItem(key);
    history();
  } catch {
    get("status").textContent = "Device storage is unavailable.";
  }
});
let ocrScript;
function loadOCR() {
  ocrScript ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js";
    script.onload = resolve;
    script.onerror = () => {
      script.remove();
      ocrScript = undefined;
      reject(new Error("OCR library unavailable."));
    };
    document.head.append(script);
  });
  return ocrScript;
}
get("image").addEventListener("change", async (event) => {
  const input = event.currentTarget;
  const file = input.files[0];
  if (!file) return;
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 8 * 1024 * 1024
  ) {
    get("status").textContent = "Choose a PNG, JPEG, or WebP image up to 8 MB.";
    input.value = "";
    return;
  }
  let worker;
  for (const id of ["submit", "example", "image", "listing"])
    get(id).disabled = true;
  get("status").textContent = "Loading English OCR…";
  try {
    await loadOCR();
    worker = await globalThis.Tesseract.createWorker("eng", 1, {
      logger: ({ status, progress }) => {
        if (status === "recognizing text")
          get("status").textContent =
            `Reading screenshot… ${Math.round(progress * 100)}%`;
      },
    });
    const { data } = await worker.recognize(file);
    if (data.text.trim())
      get("listing").value = data.text.trim().slice(0, 12000);
    get("status").textContent = data.text.trim()
      ? "Review the extracted text before checking."
      : "No text extracted. Try a clearer screenshot or paste the text.";
  } catch {
    get("status").textContent =
      "Could not read this screenshot. Check your connection or paste the listing text.";
  } finally {
    try {
      await worker?.terminate();
    } finally {
      input.value = "";
      for (const id of ["submit", "example", "image", "listing"])
        get(id).disabled = false;
    }
  }
});
history();
const sample = new URLSearchParams(location.search).get("example");
if (Object.hasOwn(examples, sample)) {
  get("category").value = sample;
  get("listing").value = examples[sample];
  show(analyze(examples[sample], sample));
}
