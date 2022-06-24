export const enum NodeType {
    /**
     * An Element node such as &lt;p&gt; or &lt;div&gt;.
     */
    Element = 1,

    /**
     * An Attribute node such as name="value".
     */
    Attribute = 2,

    /**
     * The actual Text of Element or Attr.
     */
    Text = 3,

    /**
     * A ProcessingInstruction of an XML document such as &lt;?xml-stylesheet ... ?&gt; declaration.
     */
    ProcessingInstruction = 7,

    /**
     * A Comment node.
     */
    Comment = 8,

    /**
     * A Document node.
     */
    Document = 9,

    /**
     * A DocumentType node e.g. &lt;!DOCTYPE html&gt; for HTML5 documents.
     */
    DocumentType = 10,

    /**
     * A DocumentFragment node.
     */
    DocumentFragment = 11,
}

export interface NodeTypeMap {
    [NodeType.Attribute]: Attr;
    [NodeType.Comment]: Comment;
    [NodeType.DocumentFragment]: DocumentFragment;
    [NodeType.Document]: Document;
    [NodeType.DocumentType]: DocumentType;
    [NodeType.Element]: HTMLElement;
    [NodeType.ProcessingInstruction]: ProcessingInstruction;
    [NodeType.Text]: Text;
}

export default function isNodeOfType<T extends NodeType>(
    node: Node | null,
    expectedType: T
): node is NodeTypeMap[T] {
    return node && node.nodeType == expectedType;
}
