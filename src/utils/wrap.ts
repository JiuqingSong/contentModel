export default function wrap(node: Node, tag: string) {
    const element = node.ownerDocument.createElement(tag);

    while (node.firstChild) {
        element.appendChild(node.firstChild);
    }

    node.appendChild(element);

    return element;
}
