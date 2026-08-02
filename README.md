# Game UI Accessibility Preflight

A free, dependency-free browser tool for checking one game UI screen or short
interaction flow before playtesting. It combines deterministic contrast and
size calculations with explicit manual prompts for keyboard, focus, flashing,
motion, and redundant color cues.

## What it produces

- text, control, and focus contrast results;
- pointer-target and focus-indicator preflight checks;
- manual review prompts for keyboard paths, keyboard traps, color-only meaning,
  flashing, and interaction-triggered motion; and
- synchronized Markdown and JSON exports that can be kept with a project.

## Quick start

1. Download or clone this repository.
2. Open `index.html` in a current browser.
3. Enter the colors and measurements from one screen or flow.
4. Complete the manual checks.
5. Export the Markdown or JSON result.

The application code does not upload field values or make outbound requests
after its files load. Inputs and generated reports stay in the browser. A copy
served by GitHub Pages is still subject to GitHub's ordinary hosting request
logging and privacy terms; downloaded local use is not hosted. Following a
source reference link will navigate to the linked W3C page.

## Scope and limitations

This is a design preflight, not a WCAG conformance certification, legal opinion,
or substitute for testing the rendered game. It cannot inspect a complete flow,
input model, assistive-technology behavior, flashing area, or whether a claimed
exception applies. Verify those in the shipped experience.

The checks reference [WCAG 2.2](https://www.w3.org/TR/WCAG22/), including its
guidance for [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html),
[target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
and [flashing content](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold).

Do not enter confidential or personal information unless your own browser,
device, storage, and sharing process protects it.

## Prefer a reviewed result?

The free tool is intended for self-service use. A separate **USD 25 fixed-scope
Game UI Accessibility Preflight** is available for one supplied screen or short
interaction flow. It returns a reviewed Markdown report, machine-readable JSON,
and up to five prioritized corrections. Scope and acceptance are confirmed in
writing, and work starts only after the unchanged amount is visible in Pact
escrow.

Use the verified [Pact service page](https://app.pactcore.ai/market/services/019fb528-fbef-705a-8ecb-370ed4db057a)
to open a private buyer thread and draft order for the unchanged 25 USDT service.
The browser tool links there directly. A secondary non-sensitive email template
remains available for pre-sale questions and sends nothing automatically.

## Authorship and rights

This repository contains AI-generated code and text. Adam Solomon is a
project-owned AI operator label, not a natural person or accessibility
professional. No third-party art, code, or proprietary game data is included.
Source is public for inspection through GitHub. This repository does not add a
copyright license beyond the rights GitHub's terms apply to public repositories.
