import { ParagraphFormatHandlers, SegmentFormatHandlers } from './formatHandlers';
import { wrap } from 'roosterjs-editor-dom';
import {
    ContentModel_Block,
    ContentModel_BlockGroupType,
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
            let newParent = parent;

            switch (block.blockGroupType) {
                case ContentModel_BlockGroupType.Code: // TODO
                case ContentModel_BlockGroupType.Document: // TODO
                case ContentModel_BlockGroupType.Entity: // TODO
                case ContentModel_BlockGroupType.Header: // TODO
                case ContentModel_BlockGroupType.ListItem: // TODO
                case ContentModel_BlockGroupType.Quote: // TODO
                case ContentModel_BlockGroupType.TableCell: // TODO
                    break;
            }

            block.blocks.forEach(childBlock =>
                createBlockFromContentModel(doc, newParent, childBlock, context)
            );

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

    ParagraphFormatHandlers.forEach(handler => handler.writeBack(paragraph.format, div));

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
    if (
        previousSegment &&
        previousSpan &&
        previousSegment.type == ContentModel_SegmentType.Text &&
        segment.type == ContentModel_SegmentType.Text &&
        areSameFormats(segment.format, previousSegment.format)
    ) {
        previousSpan.textContent += segment.text;
        return previousSpan;
    } else {
        let element: HTMLElement;

        switch (segment.type) {
            case ContentModel_SegmentType.Image:
                element = doc.createElement('img');
                element.setAttribute('src', segment.src);
                break;
            case ContentModel_SegmentType.Text:
                element = doc.createElement('span');
                element.appendChild(doc.createTextNode(segment.text));
                break;

            case ContentModel_SegmentType.Br:
                element = doc.createElement('br');
                break;
        }

        if (element) {
            parent.appendChild(element);

            SegmentFormatHandlers.forEach(handler => {
                handler.writeBack(segment.format, element);
            });
        }

        return element;
    }
}
