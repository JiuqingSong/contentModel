import isNodeOfType, { NodeType } from '../utils/isNodeOfType';
import normalizePosition, { SelectionPosition } from '../utils/normalizePosition';
import { ContentModel_Segment, ContentModel_SegmentType } from './types/Segment';
import { ParagraphFormatHandlers, SegmentFormatHandlers } from '../common/formatHandlers';
import { SelectionContext, SelectionInfo } from '../common/commonTypes';
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
    model: ContentModel_Document,
    optimizeLevel: number
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

    if (info.start?.container?.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
        normalizePosition(info.start);
    }
    if (info.end?.container?.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
        normalizePosition(info.end);
    }

    optimize(fragment, optimizeLevel);

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
                case ContentModel_BlockGroupType.UnknownBlock:
                    newParent = block.node;
                    parent.appendChild(newParent);
                    break;
                default:
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
    let container: HTMLElement;

    if (paragraph.isDummy) {
        container = parent as HTMLElement;
    } else {
        container = doc.createElement('div');
        parent.appendChild(container);
        ParagraphFormatHandlers.forEach(handler => handler.writeBack(paragraph.format, container));
    }

    setCurrentBlockElement(info.context, container);

    paragraph.segments.forEach(segment => {
        createSegmentFromContent(doc, container, segment, info);
    });
}

function setCurrentBlockElement(context: SelectionContext, element: HTMLElement) {
    context.currentBlockNode = element;
    context.currentSegmentNode = null;
}

function createTable(doc: Document, parent: Node, table: ContentModel_Table, info: SelectionInfo) {
    const tableNode = doc.createElement('table');
    parent.appendChild(tableNode);

    const tbody = doc.createElement('tbody');
    tableNode.appendChild(tbody);

    for (let row = 0; row < table.cells.length; row++) {
        const tr = doc.createElement('tr');
        tbody.appendChild(tr);

        for (let col = 0; col < table.cells[row].length; col++) {
            const cell = table.cells[row][col];

            if (!cell.spanAbove && !cell.spanLeft) {
                const td = doc.createElement(cell.isHeader ? 'th' : 'td');
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
    if (!info.start && segment.isSelected) {
        info.start = getSelectionPosition(info.context);
    }

    if (info.start && !info.end && !segment.isSelected) {
        info.end = getSelectionPosition(info.context);
    }

    let element: HTMLElement;

    switch (segment.segmentType) {
        case ContentModel_SegmentType.Image:
            element = doc.createElement('img');
            element.setAttribute('src', segment.src);
            info.context.currentSegmentNode = element;
            break;
        case ContentModel_SegmentType.Text:
            const txt = doc.createTextNode(segment.text);

            if (segment.format.linkHref) {
                element = doc.createElement('a');
                element.setAttribute('href', segment.format.linkHref);
                element.setAttribute('target', segment.format.linkTarget);
            } else {
                element = doc.createElement('span');
            }
            element.appendChild(txt);
            info.context.currentSegmentNode = txt;
            break;

        case ContentModel_SegmentType.Br:
            element = doc.createElement('br');
            info.context.currentSegmentNode = element;
            break;

        case ContentModel_SegmentType.UnknownSegment:
            element = segment.node as HTMLElement;
            info.context.currentSegmentNode = element;

            createBlockFromContentModel(doc, parent, segment, info);
            break;
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
    } else if (isNodeOfType(context.currentSegmentNode, NodeType.Text)) {
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

const OptimizeTags = ['SPAN', 'B', 'EM', 'I', 'U', 'SUB', 'SUP', 'STRIKE', 'S', 'A'];

function optimize(root: Node, optimizeLevel: number) {
    if (optimizeLevel >= 1) {
        for (let child = root.firstChild; child; ) {
            const next = child.nextSibling;

            if (
                next &&
                isNodeOfType(child, NodeType.Element) &&
                isNodeOfType(next, NodeType.Element) &&
                child.tagName == next.tagName &&
                OptimizeTags.indexOf(child.tagName) >= 0 &&
                hasSameAttributes(child, next)
            ) {
                while (next.firstChild) {
                    child.appendChild(next.firstChild);
                }

                next.parentNode.removeChild(next);
            } else {
                child = next;
            }
        }
    }

    if (optimizeLevel >= 2) {
        for (let child = root.firstChild; child; ) {
            if (
                isNodeOfType(child, NodeType.Element) &&
                child.tagName == 'SPAN' &&
                child.attributes.length == 0
            ) {
                const node = child;
                let refNode = child.nextSibling;
                child = child.nextSibling;

                while (node.lastChild) {
                    const newNode = node.lastChild;
                    root.insertBefore(newNode, refNode);
                    refNode = newNode;
                }

                root.removeChild(node);
            } else {
                child = child.nextSibling;
            }
        }
    }

    for (let child = root.firstChild; child; child = child.nextSibling) {
        optimize(child, optimizeLevel);
    }
}

function hasSameAttributes(element1: HTMLElement, element2: HTMLElement) {
    const attr1 = element1.attributes;
    const attr2 = element2.attributes;

    if (attr1.length != attr2.length) {
        return false;
    }

    for (let i = 0; i < attr1.length; i++) {
        if (attr1[i].name != attr2[i].name || attr1[i].value != attr2[i].value) {
            return false;
        }
    }

    return true;
}
