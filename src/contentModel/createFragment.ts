import { wrap } from 'roosterjs-editor-dom';
import {
    ContentModel_Block,
    ContentModel_BlockType,
    ContentModel_Document,
    ContentModel_Paragraph,
    ContentModel_Table,
} from './types/Block';
import {
    ContentModel_Segment,
    ContentModel_SegmentFormat,
    ContentModel_SegmentType,
} from './types/Segment';

export interface SelectionContext {
    isInSelection: boolean;
    previousSelectionAnchor: HTMLElement | null;
    startContainer?: Node;
    endContainer?: Node;
    startOffset?: number;
    endOffset?: number;
}

const DummySegmentFormat: Required<ContentModel_SegmentFormat> = {
    bold: false,
    italic: false,
    underline: false,
    subscript: false,
    superscript: false,
    strikethrough: false,
    fontFamily: '',
    fontSize: '',
    color: '',
    backgroundColor: '',
    linkHref: '',
    linkTarget: '',
};
const SegmentFormatKeys = Object.keys(DummySegmentFormat) as (keyof ContentModel_SegmentFormat)[];

export default function createFragment(
    doc: Document,
    model: ContentModel_Document
): [DocumentFragment, SelectionContext] {
    const fragment = doc.createDocumentFragment();
    const context: SelectionContext = {
        isInSelection: false,
        previousSelectionAnchor: null,
    };

    createBlockFromContentModel(doc, fragment, model, context);

    if (context.startContainer && !context.endContainer) {
        if (context.previousSelectionAnchor) {
            context.endContainer = context.previousSelectionAnchor;
            context.endOffset = context.endContainer.textContent.length;
        } else {
            context.startContainer = undefined;
            context.startOffset = undefined;
        }

        context.previousSelectionAnchor = null;
    }

    return [fragment, context];
}

function createBlockFromContentModel(
    doc: Document,
    parent: Node,
    block: ContentModel_Block,
    context: SelectionContext
) {
    switch (block.blockType) {
        case ContentModel_BlockType.List:
            break;

        case ContentModel_BlockType.Table:
            createTable(doc, parent, block, context);
            break;

        case ContentModel_BlockType.BlockGroup:
            block.blocks.forEach(block => createBlockFromContentModel(doc, parent, block, context));

            break;
        case ContentModel_BlockType.Paragraph:
            createParagraph(doc, parent, block, context);
            break;
    }
}

function createParagraph(
    doc: Document,
    parent: Node,
    paragraph: ContentModel_Paragraph,
    context: SelectionContext
) {
    const div = doc.createElement('div');
    parent.appendChild(div);

    const {
        alignment,
        direction,
        indentation,
        marginBottom,
        marginTop,
        backgroundColor,
        lineHeight,
        whiteSpace,
    } = paragraph.format;

    if (alignment !== undefined) {
        div.style.textAlign = alignment;
    }
    if (direction != undefined) {
        div.style.direction = direction;
    }
    if (indentation != undefined) {
        div.style.textIndent = indentation;
    }
    if (marginTop) {
        div.style.marginTop = marginTop;
    }
    if (marginBottom) {
        div.style.marginBottom = marginBottom;
    }
    if (backgroundColor) {
        div.style.backgroundColor = backgroundColor;
    }
    if (lineHeight) {
        div.style.lineHeight = lineHeight;
    }
    if (whiteSpace) {
        div.style.whiteSpace = whiteSpace;
    }

    let previousSegment: ContentModel_Segment | null = null;
    let previousSpan: HTMLElement | null = null;

    paragraph.segments.forEach(segment => {
        let pendingStartContainer = false;

        if (segment.isSelected && !context.isInSelection) {
            context.isInSelection = true;
            context.startOffset = previousSpan?.textContent.length || 0;
            context.startContainer = previousSpan;
            pendingStartContainer = true;
        } else if (!segment.isSelected && context.isInSelection) {
            context.isInSelection = false;
            context.endContainer = context.previousSelectionAnchor;
            context.endOffset = context.previousSelectionAnchor?.textContent.length || 0;
        }

        const newSpan = createSegmentFromContent(doc, div, segment, previousSegment, previousSpan);

        previousSegment = segment;

        if (pendingStartContainer) {
            if (context.startContainer != newSpan) {
                context.startOffset = 0;
            }

            context.startContainer = newSpan;
        }

        if (context.isInSelection) {
            context.previousSelectionAnchor = newSpan;
        }

        previousSpan = newSpan;
    });

    if (!div.textContent) {
        div.appendChild(doc.createElement('br'));
    }
}

function createTable(
    doc: Document,
    parent: Node,
    table: ContentModel_Table,
    context: SelectionContext
) {
    const tableNode = doc.createElement('table');
    parent.appendChild(tableNode);

    for (let row = 0; row < table.cells.length; row++) {
        const tr = doc.createElement('tr');
        tableNode.appendChild(tr);

        for (let col = 0; col < table.cells[row].length; col++) {
            const cell = table.cells[row][col];

            if (!cell.spanAbove && !cell.spanLeft) {
                const td = doc.createElement('td');
                tr.appendChild(td);

                let rowSpan = 1;
                let colSpan = 1;

                for (; table.cells[row + rowSpan]?.[col]?.spanAbove; rowSpan++) {}
                for (; table.cells[row][col + colSpan]?.spanLeft; colSpan++) {}

                if (rowSpan > 1) {
                    td.rowSpan = rowSpan;
                }

                if (colSpan > 1) {
                    td.colSpan = colSpan;
                }

                createBlockFromContentModel(doc, td, cell, context);
            }
        }
    }
}

function areSameFormats(f1: ContentModel_SegmentFormat, f2: ContentModel_SegmentFormat) {
    return SegmentFormatKeys.every(k => f1[k] === f2[k]);
}

function createSegmentFromContent(
    doc: Document,
    parent: Node,
    segment: ContentModel_Segment,
    previousSegment: ContentModel_Segment | null,
    previousSpan: HTMLSpanElement | null
) {
    switch (segment.type) {
        case ContentModel_SegmentType.Text:
            if (
                previousSegment &&
                previousSpan &&
                areSameFormats(segment.format, previousSegment.format)
            ) {
                previousSpan.textContent += segment.text;
                return previousSpan;
            } else {
                const span = doc.createElement('span');

                parent.appendChild(span);
                span.appendChild(doc.createTextNode(segment.text));

                const {
                    fontFamily,
                    fontSize,
                    color,
                    backgroundColor,
                    bold,
                    italic,
                    underline,
                    strikethrough,
                    linkHref,
                    linkTarget,
                    subscript,
                    superscript,
                } = segment.format;

                if (fontFamily) {
                    span.style.fontFamily = fontFamily;
                }

                if (fontSize) {
                    span.style.fontSize = fontSize;
                }

                if (color) {
                    span.style.color = color;
                }

                if (backgroundColor) {
                    span.style.backgroundColor = backgroundColor;
                }

                if (linkHref) {
                    const a = wrap(span, 'A') as HTMLAnchorElement;
                    a.href = linkHref;

                    if (linkTarget) {
                        a.target = linkTarget;
                    }
                }

                if (superscript) {
                    wrap(span, 'SUP');
                }

                if (subscript) {
                    wrap(span, 'SUB');
                }

                if (bold) {
                    // span.style.fontWeight = 'bold';
                    wrap(span, 'B');
                }

                if (italic) {
                    // span.style.fontStyle = 'italic';
                    wrap(span, 'I');
                }

                if (underline) {
                    // span.style.textDecoration += 'underline ';
                    wrap(span, 'U');
                }

                if (strikethrough) {
                    // span.style.textDecoration += 'line-through ';
                    wrap(span, 'STRIKE');
                }

                return span;
            }
    }
}
