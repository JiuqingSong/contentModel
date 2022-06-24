import { ContentModel_Segment, ContentModel_SegmentType } from './types/Segment';
import { ParagraphFormatHandlers, SegmentFormatHandlers } from '../common/formatHandlers';
import { SelectionContext, SelectionInfo, SelectionPosition } from '../common/commonTypes';
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
): [DocumentFragment, SelectionPosition, SelectionPosition] {
    const fragment = doc.createDocumentFragment();
    const info: SelectionInfo = {
        context: {
            currentBlockNode: null,
            currentSegmentNode: null,
        },
    };

    createBlockFromContentModel(doc, fragment, model, info);

    if (info.start && !info.end) {
        info.end = getSelectionPosition(info.context);
    }

    // fragment.normalize();

    return [fragment, info.start, info.end];
}

function createBlockFromContentModel(
    doc: Document,
    parent: Node,
    block: ContentModel_Block,
    info: SelectionInfo
) {
    switch (block.blockType) {
        case ContentModel_BlockType.List:
            break;

        case ContentModel_BlockType.Table:
            createTable(doc, parent, block, info);
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
                createBlockFromContentModel(doc, newParent, childBlock, info)
            );

            break;
        case ContentModel_BlockType.Paragraph:
            createParagraph(doc, parent, block, info);
            break;
    }
}

function createParagraph(
    doc: Document,
    parent: Node,
    paragraph: ContentModel_Paragraph,
    info: SelectionInfo
) {
    const div = doc.createElement('div');
    parent.appendChild(div);
    setCurrentBlockElement(info.context, div);

    ParagraphFormatHandlers.forEach(handler => handler.writeBack(paragraph.format, div));

    paragraph.segments.forEach(segment => {
        createSegmentFromContent(doc, div, segment, info);
    });
}

function setCurrentBlockElement(context: SelectionContext, element: HTMLElement) {
    context.currentBlockNode = element;
    context.currentSegmentNode = null;
}

function createTable(doc: Document, parent: Node, table: ContentModel_Table, info: SelectionInfo) {
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

                createBlockFromContentModel(doc, td, cell, info);
            }
        }
    }
}

function createSegmentFromContent(
    doc: Document,
    parent: Node,
    segment: ContentModel_Segment,
    info: SelectionInfo
) {
    if (info.start && !info.end && !segment.isSelected) {
        info.end = getSelectionPosition(info.context);
    }

    let element: HTMLElement;

    switch (segment.type) {
        case ContentModel_SegmentType.Image:
            element = doc.createElement('img');
            element.setAttribute('src', segment.src);
            info.context.currentSegmentNode = element;
            break;
        case ContentModel_SegmentType.Text:
            const txt = doc.createTextNode(segment.text);
            element = doc.createElement('span');
            element.appendChild(txt);
            info.context.currentSegmentNode = txt;
            break;

        case ContentModel_SegmentType.Br:
            element = doc.createElement('br');
            info.context.currentSegmentNode = element;
            break;
    }

    if (!info.start && segment.isSelected) {
        info.start = getSelectionPosition(info.context);
    }

    if (element) {
        parent.appendChild(element);

        SegmentFormatHandlers.forEach(handler => {
            handler.writeBack(segment.format, element);
        });
    }
}

function getSelectionPosition(context: SelectionContext): SelectionPosition | null {
    if (!context.currentBlockNode) {
        return null;
    } else if (!context.currentSegmentNode) {
        return {
            container: context.currentBlockNode,
            offset: 0,
        };
    } else if (context.currentSegmentNode.nodeType == Node.TEXT_NODE) {
        return {
            container: context.currentSegmentNode,
            offset: context.currentSegmentNode.nodeValue.length,
        };
    } else {
        return {
            container: context.currentSegmentNode.parentNode,
            offset: indexOf(context.currentSegmentNode) + 1,
        };
    }
}

function indexOf(node: Node): number {
    let index = 0;
    for (
        let child = node.parentNode.firstChild;
        child && child != node;
        child = child.nextSibling
    ) {
        index++;
    }

    return index;
}
