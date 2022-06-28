export interface SelectionPosition {
    container: Node;
    offset: number;
}

export default function normalizePosition(pos: SelectionPosition) {
    if (pos.container.nodeType == Node.TEXT_NODE || !pos.container.firstChild) {
        return; // TODO
    }

    let node = pos.container;
    let newOffset = pos.offset;

    while (node.nodeType == Node.ELEMENT_NODE || node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
        const nextNode = newOffset == 0 ? node.firstChild : node.childNodes[newOffset];

        if (nextNode) {
            node = nextNode;
            newOffset = 0;
        } else {
            break;
        }
    }

    pos.container = node;
    pos.offset = newOffset;
}
