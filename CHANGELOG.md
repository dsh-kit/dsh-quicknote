# Changelog

## 0.1.1

- Restore dark-mode styling with the DSH theme tokens
- Restore the notebook icon and use Quick Note / 随手记 consistently in the composer
- Add search, All/Open/Done filters, timestamps, copy and insert actions
- Add copy-all as Markdown and the primary+alt+S capture shortcut
- Record the source Session on captured notes
- Show a parked-draft receipt with undo after “save and clear draft”
- Parse `#tag` in notes and filter the list by tag
- Make delete reversible with an undo toast, including batch undo
- Insert a note into the current Session even while the page covers the conversation
- Open the notes page from the capture card with View all
- Serialize note-store writes so overlapping requests cannot corrupt the JSON file
- Stack note actions under the text in narrow windows so labels no longer wrap
- Package homepage now points to the plugin documentation, not the GitHub repository

## 0.1.0

First release.

- Composer toolbar button with a capture card prefilled from the current draft
- Save note, or save and explicitly clear the draft
- Sidebar page: newest-first list, done/reopen, delete
- Four Agent tools: add, list, done, delete
- Local JSON store at `~/.dsh/quicknote/notes.json` (0600, atomic writes)
