import { areSameFormats, SelectionContext } from '../common/commonTypes';
import { ContentModel_Segment, ContentModel_SegmentType } from './types/Segment';
import { createRange } from 'roosterjs-editor-dom';
import { ParagraphFormatHandlers, SegmentFormatHandlers } from '../common/formatHandlers';
import {
    ContentModel_Block,
    ContentModel_BlockGroupType,
    ContentModel_BlockType,
    ContentModel_Document,
    ContentModel_Paragraph,
    ContentModel_Table,
} from './types/Block';

export default function createFragment(
    doc: Document,
    model: ContentModel_Document
): [DocumentFragment, SelectionContext] {
    const fragment = doc.createDocumentFragment();
    const context: SelectionContext = {
        isInSelection: false,
        lastElement: null,
    };

    createBlockFromContentModel(doc, fragment, model, context);

    if (context.startContainer && !context.endContainer) {
        if (context.lastElement) {
            context.endContainer = context.lastElement.parentNode;
            context.endOffset = context.lastElement.parentNode.childNodes.length;
        } else {
            context.startContainer = undefined;
            context.startOffset = undefined;
        }

        context.lastElement = null;
    }

    const range =
        context.startContainer && context.endContainer
            ? createRange(
                  context.startContainer,
                  context.startOffset,
                  context.endContainer,
                  context.endOffset
              )
            : null;

    fragment.normalize();

    if (range) {
        context.startContainer = range.startContainer;
        context.endContainer = range.endContainer;
        context.startOffset = range.startOffset;
        context.endOffset = range.endOffset;

        return [fragment, context];
    } else {
        return [fragment, null];
    }
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

    paragraph.segments.forEach(segment => {
        createSegmentFromContent(doc, div, segment, context); //, previousSegment, previousSpan);
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

function createSegmentFromContent(
    doc: Document,
    parent: Node,
    segment: ContentModel_Segment,
    context: SelectionContext
) {
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

        case ContentModel_SegmentType.CollpasedSelection:
            context.startContainer = context.endContainer = parent;
            context.startOffset = context.endOffset = parent.childNodes.length;
            break;
    }

    if (element) {
        if (!context.isInSelection && segment.isSelected) {
            context.isInSelection = true;
            context.startContainer = parent;
            context.startOffset = parent.childNodes.length;
        } else if (context.isInSelection && !segment.isSelected) {
            context.isInSelection = false;
            context.endContainer = parent;
            context.endOffset = parent.childNodes.length;
        }

        parent.appendChild(element);
        context.lastElement = element;

        SegmentFormatHandlers.forEach(handler => {
            handler.writeBack(segment.format, element);
        });
    }
}
