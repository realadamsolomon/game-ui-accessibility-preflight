(function (global) {
  "use strict";

  const SOURCES = {
    text: "WCAG 2.2 SC 1.4.3",
    color: "WCAG 2.2 SC 1.4.1",
    nonText: "WCAG 2.2 SC 1.4.11",
    keyboard: "WCAG 2.2 SC 2.1.1 / 2.1.2",
    focus: "WCAG 2.2 SC 2.4.7 and 2.4.13",
    target: "WCAG 2.2 SC 2.5.8",
    flashes: "WCAG 2.2 SC 2.3.1",
    motion: "WCAG 2.2 SC 2.3.3"
  };

  const DEFAULT_STATE = Object.freeze({
    projectName: "Untitled game",
    screenName: "Main menu",
    textColor: "#F7F8FF",
    backgroundColor: "#101525",
    uiColor: "#78DCE8",
    focusColor: "#FFD866",
    textSizePx: 16,
    targetWidthPx: 44,
    targetHeightPx: 44,
    focusThicknessPx: 2,
    flashesPerSecond: null,
    boldText: false,
    hasRedundantColorCue: false,
    keyboardPathVerified: false,
    visibleFocusVerified: false,
    targetExceptionVerified: false,
    flashThresholdVerified: false,
    motionControlVerified: false,
    notes: ""
  });

  function normalizeHex(value) {
    const raw = String(value || "").trim().toUpperCase();
    const short = /^#?([0-9A-F]{3})$/.exec(raw);
    if (short) return `#${short[1].split("").map((character) => character + character).join("")}`;
    const full = /^#?([0-9A-F]{6})$/.exec(raw);
    return full ? `#${full[1]}` : null;
  }

  function hexToRgb(value) {
    const normalized = normalizeHex(value);
    if (!normalized) return null;
    return {
      r: Number.parseInt(normalized.slice(1, 3), 16),
      g: Number.parseInt(normalized.slice(3, 5), 16),
      b: Number.parseInt(normalized.slice(5, 7), 16)
    };
  }

  function relativeLuminance(value) {
    const rgb = hexToRgb(value);
    if (!rgb) return null;
    const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function contrastRatio(first, second) {
    const firstLum = relativeLuminance(first);
    const secondLum = relativeLuminance(second);
    if (firstLum === null || secondLum === null) return null;
    const light = Math.max(firstLum, secondLum);
    const dark = Math.min(firstLum, secondLum);
    return (light + 0.05) / (dark + 0.05);
  }

  function isLargeText(sizePx, bold) {
    return Number(sizePx) >= (bold ? 18.6667 : 24);
  }

  function numberOr(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function boundedNumber(value, minimum, maximum) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
  }

  function evaluate(input) {
    const state = { ...DEFAULT_STATE, ...input };
    const textRatio = contrastRatio(state.textColor, state.backgroundColor);
    const uiRatio = contrastRatio(state.uiColor, state.backgroundColor);
    const focusRatio = contrastRatio(state.focusColor, state.backgroundColor);
    const textSize = boundedNumber(state.textSizePx, 8, 160);
    const targetWidth = boundedNumber(state.targetWidthPx, 1, 500);
    const targetHeight = boundedNumber(state.targetHeightPx, 1, 500);
    const focusThickness = boundedNumber(state.focusThicknessPx, 0, 20);
    const flashes = boundedNumber(state.flashesPerSecond, 0, 60);
    const largeText = textSize !== null && isLargeText(textSize, state.boldText);
    const textThreshold = largeText ? 3 : 4.5;
    const targetLargeEnough = targetWidth !== null && targetHeight !== null && targetWidth >= 24 && targetHeight >= 24;
    const focusThickEnough = focusThickness !== null && focusThickness >= 2;

    const results = [
      {
        id: "text-contrast",
        label: "Text contrast",
        criterion: SOURCES.text,
        status: textRatio === null || textSize === null ? "review" : textRatio >= textThreshold ? "pass" : "fail",
        value: textRatio,
        detail: textRatio === null || textSize === null
          ? "Enter valid hexadecimal colors and a text size from 8 to 160 CSS pixels."
          : `${textRatio.toFixed(2)}:1 against a ${textThreshold}:1 threshold for ${largeText ? "large" : "normal"} text.`
      },
      {
        id: "non-text-contrast",
        label: "Control and icon contrast",
        criterion: SOURCES.nonText,
        status: uiRatio !== null && uiRatio >= 3 ? "pass" : "fail",
        value: uiRatio,
        detail: uiRatio === null ? "Enter valid hexadecimal colors." : `${uiRatio.toFixed(2)}:1 against the 3:1 non-text threshold.`
      },
      {
        id: "focus",
        label: "Visible focus",
        criterion: SOURCES.focus,
        status: !state.visibleFocusVerified
          ? "review"
          : focusRatio !== null && focusThickEnough
            ? focusRatio >= 3 ? "pass" : "fail"
            : "review",
        value: focusRatio,
        detail: !state.visibleFocusVerified
          ? "The manual visible-focus check is not verified."
          : focusRatio === null || focusThickness === null
            ? "Enter a valid focus color and thickness from 0 to 20 CSS pixels."
            : `${focusRatio.toFixed(2)}:1 change against the background with a ${focusThickness} px indicator. The preflight uses the AAA focus-appearance size and contrast target as a strong design check.`
      },
      {
        id: "target-size",
        label: "Pointer target size",
        criterion: SOURCES.target,
        status: targetWidth !== null && targetHeight !== null && (targetLargeEnough || state.targetExceptionVerified) ? "pass" : "review",
        value: null,
        detail: targetWidth === null || targetHeight === null
          ? "Enter target width and height from 1 to 500 CSS pixels."
          : targetLargeEnough
          ? `${targetWidth} × ${targetHeight} CSS px meets the 24 × 24 size floor.`
          : state.targetExceptionVerified
            ? `Undersized at ${targetWidth} × ${targetHeight} CSS px; a spacing or equivalent-control exception is marked as manually verified.`
            : `Undersized at ${targetWidth} × ${targetHeight} CSS px. Enlarge it or verify an applicable exception in the rendered layout.`
      },
      {
        id: "color-cue",
        label: "Meaning beyond color",
        criterion: SOURCES.color,
        status: state.hasRedundantColorCue ? "pass" : "review",
        value: null,
        detail: state.hasRedundantColorCue
          ? "A non-color cue is marked as present."
          : "Not verified. Confirm that meaning has a text, shape, icon, pattern, or other non-color cue."
      },
      {
        id: "keyboard",
        label: "Keyboard path",
        criterion: SOURCES.keyboard,
        status: state.keyboardPathVerified ? "pass" : "review",
        value: null,
        detail: state.keyboardPathVerified
          ? "Keyboard access and absence of a keyboard trap are marked as manually verified."
          : "Run the full flow without a pointer and confirm focus order, activation, escape routes, and no keyboard trap."
      },
      {
        id: "flashing",
        label: "Flashing content",
        criterion: SOURCES.flashes,
        status: flashes !== null && (flashes <= 3 || state.flashThresholdVerified) ? "pass" : "review",
        value: null,
        detail: flashes === null
          ? "Not measured. Enter a value from 0 to 60; enter 0 only after confirming the screen has no flashing."
          : flashes <= 3
          ? `${flashes} flashes per second does not exceed the simple three-flash frequency check.`
          : state.flashThresholdVerified
            ? `${flashes} flashes per second; the general and red-flash thresholds are marked as separately measured.`
            : `${flashes} flashes per second needs a qualified general/red-flash threshold analysis. Do not rely on frequency alone.`
      },
      {
        id: "motion",
        label: "Motion control",
        criterion: SOURCES.motion,
        status: state.motionControlVerified ? "pass" : "review",
        value: null,
        detail: state.motionControlVerified
          ? "Nonessential interaction-triggered motion is marked as suppressible."
          : "Not verified. Confirm that nonessential interaction-triggered motion can be disabled or follows reduced-motion settings."
      }
    ];

    return {
      state,
      metrics: { textRatio, uiRatio, focusRatio, textThreshold, largeText },
      results,
      counts: results.reduce((counts, result) => {
        counts[result.status] += 1;
        return counts;
      }, { pass: 0, review: 0, fail: 0 })
    };
  }

  function safeText(value) {
    return String(value ?? "").replace(/[<>]/g, "");
  }

  function reportMarkdown(input, generatedAt = new Date().toISOString()) {
    const evaluation = evaluate(input);
    const lines = [
      "# Game UI Accessibility Preflight Report",
      "",
      `- Project: ${safeText(evaluation.state.projectName) || "Untitled"}`,
      `- Screen or flow: ${safeText(evaluation.state.screenName) || "Unspecified"}`,
      `- Generated: ${generatedAt}`,
      `- Summary: ${evaluation.counts.pass} pass, ${evaluation.counts.review} review, ${evaluation.counts.fail} fail`,
      "",
      "## Results",
      ""
    ];
    for (const result of evaluation.results) {
      lines.push(`- **${result.status.toUpperCase()} — ${result.label}** (${result.criterion}): ${result.detail}`);
    }
    lines.push("", "## Notes", "", safeText(evaluation.state.notes) || "None recorded.");
    lines.push("", "## Scope", "", "This is a design preflight, not a WCAG conformance certification. Verify the rendered game, complete input paths, assistive-technology behavior, animation area, and any claimed exceptions.", "");
    return lines.join("\n");
  }

  const api = { DEFAULT_STATE, SOURCES, normalizeHex, hexToRgb, relativeLuminance, contrastRatio, isLargeText, boundedNumber, evaluate, reportMarkdown };
  global.GameUIPreflightCore = api;

  if (typeof document === "undefined") return;

  const ids = [
    "project-name", "screen-name", "text-color", "background-color", "ui-color", "focus-color",
    "text-size", "target-width", "target-height", "focus-thickness", "flashes-per-second", "bold-text",
    "redundant-color-cue", "keyboard-path", "visible-focus", "target-exception", "flash-threshold",
    "motion-control", "notes"
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
  const colorPairs = [
    ["text-color", "text-color-picker"],
    ["background-color", "background-color-picker"],
    ["ui-color", "ui-color-picker"],
    ["focus-color", "focus-color-picker"]
  ];

  function readState() {
    return {
      projectName: elements["project-name"].value,
      screenName: elements["screen-name"].value,
      textColor: elements["text-color"].value,
      backgroundColor: elements["background-color"].value,
      uiColor: elements["ui-color"].value,
      focusColor: elements["focus-color"].value,
      textSizePx: boundedNumber(elements["text-size"].value, 8, 160),
      targetWidthPx: boundedNumber(elements["target-width"].value, 1, 500),
      targetHeightPx: boundedNumber(elements["target-height"].value, 1, 500),
      focusThicknessPx: boundedNumber(elements["focus-thickness"].value, 0, 20),
      flashesPerSecond: boundedNumber(elements["flashes-per-second"].value, 0, 60),
      boldText: elements["bold-text"].checked,
      hasRedundantColorCue: elements["redundant-color-cue"].checked,
      keyboardPathVerified: elements["keyboard-path"].checked,
      visibleFocusVerified: elements["visible-focus"].checked,
      targetExceptionVerified: elements["target-exception"].checked,
      flashThresholdVerified: elements["flash-threshold"].checked,
      motionControlVerified: elements["motion-control"].checked,
      notes: elements.notes.value
    };
  }

  function writeState(input) {
    const state = { ...DEFAULT_STATE, ...input };
    const mappings = {
      "project-name": "projectName", "screen-name": "screenName", "text-color": "textColor",
      "background-color": "backgroundColor", "ui-color": "uiColor", "focus-color": "focusColor",
      "text-size": "textSizePx", "target-width": "targetWidthPx", "target-height": "targetHeightPx",
      "focus-thickness": "focusThicknessPx", "flashes-per-second": "flashesPerSecond", notes: "notes"
    };
    for (const [id, key] of Object.entries(mappings)) elements[id].value = state[key] ?? "";
    const checkboxMappings = {
      "bold-text": "boldText", "redundant-color-cue": "hasRedundantColorCue", "keyboard-path": "keyboardPathVerified",
      "visible-focus": "visibleFocusVerified", "target-exception": "targetExceptionVerified", "flash-threshold": "flashThresholdVerified",
      "motion-control": "motionControlVerified"
    };
    for (const [id, key] of Object.entries(checkboxMappings)) elements[id].checked = Boolean(state[key]);
    for (const [textId, pickerId] of colorPairs) {
      const normalized = normalizeHex(elements[textId].value);
      if (normalized) document.getElementById(pickerId).value = normalized;
    }
    render();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  }

  function metricMarkup(label, value) {
    return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${value === null ? "—" : `${value.toFixed(2)}:1`}</strong></div>`;
  }

  function render() {
    const evaluation = evaluate(readState());
    const preview = document.getElementById("live-preview");
    const background = normalizeHex(evaluation.state.backgroundColor);
    const text = normalizeHex(evaluation.state.textColor);
    const ui = normalizeHex(evaluation.state.uiColor);
    const focus = normalizeHex(evaluation.state.focusColor);
    if (background) preview.style.backgroundColor = background;
    if (text) preview.style.color = text;
    const sampleButton = preview.querySelector(".sample-button");
    if (ui) sampleButton.style.borderColor = ui;
    if (focus) sampleButton.style.outlineColor = focus;
    sampleButton.style.outlineWidth = `${Math.max(0, numberOr(evaluation.state.focusThicknessPx, 0))}px`;
    sampleButton.style.outlineStyle = "solid";
    sampleButton.style.outlineOffset = "4px";
    preview.querySelector(".sample-copy").style.fontSize = `${Math.max(8, numberOr(evaluation.state.textSizePx, 16))}px`;
    preview.querySelector(".sample-copy").style.fontWeight = evaluation.state.boldText ? "700" : "400";

    document.getElementById("summary").textContent = `${evaluation.counts.pass} pass · ${evaluation.counts.review} review · ${evaluation.counts.fail} fail`;
    document.getElementById("metric-strip").innerHTML = [
      metricMarkup("Text", evaluation.metrics.textRatio),
      metricMarkup("Control", evaluation.metrics.uiRatio),
      metricMarkup("Focus", evaluation.metrics.focusRatio)
    ].join("");
    document.getElementById("result-list").innerHTML = evaluation.results.map((result) => {
      const symbols = { pass: "✓", review: "!", fail: "×" };
      return `<li class="result-item"><span class="status-mark status-${result.status}" aria-hidden="true">${symbols[result.status]}</span><div><p class="result-title">${escapeHtml(result.status.toUpperCase())} · ${escapeHtml(result.label)} <span class="criterion">${escapeHtml(result.criterion)}</span></p><p class="result-detail">${escapeHtml(result.detail)}</p></div></li>`;
    }).join("");
  }

  function download(filename, mimeType, contents) {
    const blob = new Blob([contents], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    document.getElementById("action-status").textContent = `Downloaded ${filename}`;
  }

  for (const element of Object.values(elements)) element.addEventListener("input", render);
  for (const [textId, pickerId] of colorPairs) {
    const textInput = document.getElementById(textId);
    const picker = document.getElementById(pickerId);
    picker.addEventListener("input", () => { textInput.value = picker.value.toUpperCase(); render(); });
    textInput.addEventListener("input", () => { const normalized = normalizeHex(textInput.value); if (normalized) picker.value = normalized; });
  }

  document.getElementById("reset-button").addEventListener("click", () => {
    writeState(DEFAULT_STATE);
    document.getElementById("action-status").textContent = "Default values restored. Manual checks remain unverified.";
  });
  document.getElementById("export-markdown").addEventListener("click", () => download("game-ui-accessibility-preflight.md", "text/markdown;charset=utf-8", reportMarkdown(readState())));
  document.getElementById("export-json").addEventListener("click", () => {
    const payload = { schema: "game-ui-accessibility-preflight-v1", exportedAt: new Date().toISOString(), ...evaluate(readState()) };
    download("game-ui-accessibility-preflight.json", "application/json;charset=utf-8", `${JSON.stringify(payload, null, 2)}\n`);
  });
  document.getElementById("import-json").addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      writeState(payload.state || payload);
      document.getElementById("action-status").textContent = `Imported ${file.name}`;
    } catch {
      document.getElementById("action-status").textContent = "Import failed: choose a valid preflight JSON file.";
    } finally {
      event.target.value = "";
    }
  });

  render();
})(typeof globalThis === "undefined" ? this : globalThis);
