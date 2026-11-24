# Editing website wording

Choose **Edit website text** in the top bar. Click a highlighted heading, explanation or parameter label, change its wording, and choose **Save wording**. The change appears immediately. **Find text** provides a searchable alternative to clicking, including passages whose text has been removed. Open the Evidence and Guide tabs to load their generated wording. Parameter labels and preset questions retain stable keys when controls are rerendered.

**Preview** hides edit outlines while keeping the toolbar. **Done** leaves editing mode while keeping the local draft visible. The top bar shows a local-edit badge whenever a draft exists. Browser storage is independent of the economic configuration: text editing does not reset countries, experiments, parameter values or simulation results.

Drafts save only in the current browser and website origin. They are not automatically published or shared across devices. If storage fails, the editor warns that the text exists only in the current tab. Download it before leaving. Importing a downloaded draft (by choosing the file or pasting its JSON contents) merges it with the current draft. Unknown passages remain in export; mismatched original wording is not applied to a changed source passage.

Choose **Download changes** and attach `innovation-observatory-text-changes.json` in the conversation to publish the wording. The maintainer applies it with `node scripts/apply_site_text.mjs /path/to/file.json`, previews the affected passages, and commits `dist/site-copy-data.mjs` through the current hosting overlay. GitHub Pages then publishes the revised wording. No GitHub token or password is stored in the page. Visitors can create their own local drafts but cannot change the public site.

The editor handles plain text. Links retain their destinations and existing markup. Economic controls, source tables, charts, calculated results and simulation-generated findings are not editable. Generated evidence/guide prose containing numeric observations is excluded. Words inside a formatted paragraph can be separate selectable fragments; the surrounding links and emphasis remain intact. A changed label does not change a parameter's units or economic interpretation.

**Restore published wording** clears a passage's local override. **Discard all local edits** restores public wording throughout the page; **Undo** can reverse the last thirty draft actions until the page is reloaded. Browser-local drafts should be exported before clearing browser storage.

Implementation: `dist/site-text-editor.mjs`, `site-text-model.mjs`, `site-text-editor.css`, and `site-copy-data.mjs`. The simulation engine and empirical inputs are unchanged. Reproduce schema/security checks with `node tests/site-text.mjs`; browser QA covers edits, reload persistence, view/parameter rerendering, preview, undo, restoration, JSON download and model controls.

Browser QA limitation: the automated native file-picker round trip stalled. The alternate pasted-JSON import path was tested successfully, including malformed input rejection. Export download, editing, reload persistence, search, parameter rerendering, plain-text rendering, preview and undo passed in the browser.
