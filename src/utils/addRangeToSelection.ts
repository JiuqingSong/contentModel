/**
 * Add the given range into selection of the given document
 * @param range The range to select
 * @param skipSameRange When set to true, do nothing if the given range is the same with current selection,
 * otherwise it will always remove current selection range and set to the given one.
 * This parameter is always treat as true in Edge to avoid some weird runtime exception.
 */
export default function addRangeToSelection(range: Range) {
    const selection = range?.commonAncestorContainer?.ownerDocument?.defaultView?.getSelection();
    if (selection) {
        if (selection.rangeCount > 0) {
            selection.removeAllRanges();
        }

        selection.addRange(range);
    }
}
