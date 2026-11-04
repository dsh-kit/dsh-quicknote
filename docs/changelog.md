# Changelog

## 0.1.1

- Restore dark-mode styling with the DSH theme tokens
- Restore the notebook icon and use Quick Note / 随手记 consistently in the composer
- Add search, All/Open/Done filters, `#tag` filters, timestamps, copy and insert actions
- Add copy-all as Markdown and the primary+alt+S capture shortcut
- Record the source Session on captured notes
- Show a parked-draft receipt with undo after “save and clear draft”
- Make delete reversible with an undo toast, including batch undo
- Insert a note into the current Session even while the page covers the conversation
- Serialize note-store writes so overlapping requests cannot corrupt the JSON file
- Stack note actions under the text in narrow windows so labels no longer wrap

## 0.1.0

- Composer toolbar button and capture card prefilled from the draft
- Save note, or save and explicitly clear the draft
- Sidebar page with done/reopen and delete
- Four Agent tools
- Local JSON store at `~/.dsh/quicknote/notes.json`
