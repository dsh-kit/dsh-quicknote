# Usage

## From the composer

Click **Quick Note** in the composer toolbar. The card opens with the current draft.

- **Save note**: stores the text and leaves the draft untouched.
- **Save and clear draft**: stores the text, then clears the composer only after the Host confirms the save. A receipt
  above the composer lets you reopen the note list or undo the move and restore the draft.

Closing the card without saving does nothing.

## From the sidebar

**Quick Note** lists notes newest-first. Use **All / Open / Done** and the search box to narrow the list.

## Tags

Write `#tag` anywhere in a note — `#work`, `#release-1`, `#工作` are all valid. The page collects every tag above the
list; click a tag chip to show only matching notes, and click it again (or **All tags**) to clear the filter. Tags can
be combined with the done filter and the search box. The Markdown export keeps tags because the note text is copied
verbatim.

## Row actions

Each row shows its time, its source Session when captured from the composer, and its tags. It can be copied, inserted
into the active composer, marked done/reopened, or deleted. Deleting removes the note and shows an undo toast; press
**Undo** before it closes to restore the note unchanged. Deleting more notes before it closes adds them to the same
toast, where **Undo all** restores the whole batch. **Copy all** exports the visible notes as Markdown. Press
`primary+alt+S` to open the capture card. The list is local to your DSH home, and narrow windows stack the row actions
under the note text instead of wrapping their labels.

## From an agent

Ask the model to remember something. The plugin exposes four tools:

- `quicknote_add`
- `quicknote_list`
- `quicknote_done`
- `quicknote_delete`
