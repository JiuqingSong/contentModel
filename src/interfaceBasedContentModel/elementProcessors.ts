import isNodeOfType, { NodeType } from '../utils/isNodeOfType';
import { ContentModel_Segment, ContentModel_SegmentType } from './types/Segment';
import { DefaultFormatParserType } from '../common/defaultStyles';
import { ParagraphFormatHandlers, SegmentFormatHandlers } from '../common/formatHandlers';
import {
    createBr,
    createImage,
    createParagraph,
    createSelectionMarker,
    createTable,
    createTableCell,
    createText,
} from './creators';
import {
    areSameFormats,
    ContentModel_ParagraphFormat,
    ContentModel_SegmentFormat,
} from '../common/commonTypes';
import {
    ContentModel_BlockGroup,
    ContentModel_BlockType,
    ContentModel_Paragraph,
    ContentModel_Block,
} from './types/Block';

// https://www.w3schools.com/cssref/pr_class_display.asp
const BlockDisplay = ['block', 'flex', 'grid', 'list-item'];

// const InlineDisplay = [
//     'inline',
//     'inline-block',
//     'inline-flex',
//     'inline-grid',
//     'inline-table',
//     'contents',
// ];

// const OtherDisplay = [
//     'table',
//     'table-caption',
//     'table-column-group',
//     'table-header-group',
//     'table-footer-group',
//     'table-row-group',
//     'table-cell',
//     'table-column',
//     'table-row',
//     'run-in',
//     'initial',
//     'none',
// ];

export interface FormatContext {
    tagHandlers: Record<string, TagHandler>;

    blockFormat: ContentModel_ParagraphFormat;
    segmentFormat: ContentModel_SegmentFormat;
    isInSelection: boolean;

    isSelectionCollapsed?: boolean;
    startContainer?: Node;
    endContainer?: Node;
    startOffset?: number;
    endOffset?: number;
}

export interface TagHandler {
    style: DefaultFormatParserType;
    processor: ElementProcessor;
}

export type ElementProcessor = (
    group: ContentModel_BlockGroup,
    context: FormatContext,
    element: HTMLElement,
    defaultStyle: Partial<CSSStyleDeclaration>
) => void;

export function containerProcessor(
    group: ContentModel_BlockGroup,
    parent: Node,
    context: FormatContext
) {
    let nodeStartOffset = context.startContainer == parent ? context.startOffset : -1;
    let nodeEndOffset = context.endContainer == parent ? context.endOffset : -1;
    let index = 0;

    for (let child = parent.firstChild; child; child = child.nextSibling) {
        if (index == nodeStartOffset) {
            context.isInSelection = true;

            addSegment(group, context, createSelectionMarker(context));
        }

        if (index == nodeEndOffset) {
            if (!context.isSelectionCollapsed) {
                addSegment(group, context, createSelectionMarker(context));
            }
            context.isInSelection = false;
        }

        if (isNodeOfType(child, NodeType.Element)) {
            const handler = context.tagHandlers[child.tagName];
            const processor = handler?.processor || generalProcessor;
            const format = handler
                ? typeof handler.style === 'function'
                    ? handler.style(child)
                    : handler.style
                : {};

            processor(group, context, child, format || {});
        } else if (isNodeOfType(child, NodeType.Text)) {
            const textNode = child as Text;

            let txt = textNode.nodeValue;
            let txtStartOffset = context.startContainer == textNode ? context.startOffset : -1;
            let txtEndOffset = context.endContainer == textNode ? context.endOffset : -1;

            if (txtStartOffset >= 0) {
                textProcessor(group, txt.substring(0, txtStartOffset), context);
                context.isInSelection = true;

                addSegment(group, context, createSelectionMarker(context));

                txt = txt.substring(txtStartOffset);
                txtEndOffset -= txtStartOffset;
            }

            if (txtEndOffset >= 0) {
                textProcessor(group, txt.substring(0, txtEndOffset), context);

                if (!context.isSelectionCollapsed) {
                    addSegment(group, context, createSelectionMarker(context));
                }

                context.isInSelection = false;
                txt = txt.substring(txtEndOffset);
            }

            textProcessor(group, txt, context);
        }

        index++;
    }
}

export const generalProcessor: ElementProcessor = (group, context, element, defaultStyle) => {
    const processor =
        BlockDisplay.indexOf(element.style.display || defaultStyle.display) >= 0
            ? blockProcessor
            : segmentProcessor;

    processor(group, context, element, defaultStyle);
};

export const brProcessor: ElementProcessor = (group, context) => {
    addSegment(group, context, createBr(context));
};

export const tableProcessor: ElementProcessor = (group, context, element) => {
    const tableElement = element as HTMLTableElement;
    const table = createTable(context, tableElement);

    addBlock(group, table);

    for (let row = 0; row < tableElement.rows.length; row++) {
        const tr = tableElement.rows[row];
        for (let sourceCol = 0, targetCol = 0; sourceCol < tr.cells.length; sourceCol++) {
            for (; table.cells[row][targetCol]; targetCol++) {}

            const td = tr.cells[sourceCol];

            for (let colSpan = 0; colSpan < td.colSpan; colSpan++, targetCol++) {
                for (let rowSpan = 0; rowSpan < td.rowSpan; rowSpan++) {
                    const hasTd = colSpan + rowSpan == 0;
                    const cell = createTableCell(context, colSpan, rowSpan);

                    table.cells[row + rowSpan][targetCol] = cell;

                    if (hasTd) {
                        containerProcessor(cell, td, context);
                    }
                }
            }
        }
    }
};

export const imageProcessor: ElementProcessor = (group, context, element, defaultStyle) => {
    const imageElement = element as HTMLImageElement;

    const originalSegmentFormat = context.segmentFormat;
    context.segmentFormat = { ...originalSegmentFormat };

    SegmentFormatHandlers.forEach(handler =>
        handler.parse(context.segmentFormat, imageElement, defaultStyle)
    );

    addSegment(group, context, createImage(context, imageElement));

    context.segmentFormat = originalSegmentFormat;
};

const blockProcessor: ElementProcessor = (group, context, element, defaultStyle) => {
    const originalBlockFormat = context.blockFormat;
    const originalSegmentFormat = context.segmentFormat;

    context.blockFormat = {
        ...originalBlockFormat,
    };
    context.segmentFormat = { ...originalSegmentFormat };

    ParagraphFormatHandlers.forEach(handler =>
        handler.parse(context.blockFormat, element, defaultStyle)
    );
    SegmentFormatHandlers.forEach(handler =>
        handler.parse(context.segmentFormat, element, defaultStyle)
    );

    addBlock(group, createParagraph(context));

    containerProcessor(group, element, context);
    context.blockFormat = originalBlockFormat;
    context.segmentFormat = originalSegmentFormat;

    addBlock(group, createParagraph(context));
};

const segmentProcessor: ElementProcessor = (group, context, element, defaultStyle) => {
    const originalSegmentFormat = context.segmentFormat;

    context.segmentFormat = { ...originalSegmentFormat };
    SegmentFormatHandlers.forEach(handler =>
        handler.parse(context.segmentFormat, element, defaultStyle)
    );

    containerProcessor(group, element, context);

    context.segmentFormat = originalSegmentFormat;
};

function textProcessor(group: ContentModel_BlockGroup, text: string, context: FormatContext) {
    if (text) {
        const paragraph = group.blocks[group.blocks.length - 1];
        const lastSegment =
            paragraph?.blockType == ContentModel_BlockType.Paragraph &&
            paragraph.segments[paragraph.segments.length - 1];

        if (
            lastSegment &&
            lastSegment.type == ContentModel_SegmentType.Text &&
            lastSegment.isSelected == context.isInSelection &&
            areSameFormats(lastSegment.format, context.segmentFormat)
        ) {
            lastSegment.text += text;
        } else {
            const originalSegmentFormat = context.segmentFormat;

            context.segmentFormat = { ...originalSegmentFormat };
            addSegment(group, context, createText(context, text));
            context.segmentFormat = originalSegmentFormat;
        }
    }
}

function addSegment(
    group: ContentModel_BlockGroup,
    context: FormatContext,
    newSegment: ContentModel_Segment
) {
    const lastBlock = group.blocks[group.blocks.length - 1];
    let paragraph: ContentModel_Paragraph;

    if (lastBlock?.blockType == ContentModel_BlockType.Paragraph) {
        paragraph = lastBlock;
    } else {
        paragraph = createParagraph(context);
        addBlock(group, paragraph);
    }

    const lastSegment = paragraph.segments[paragraph.segments.length - 1];

    if (newSegment.type == ContentModel_SegmentType.SelectionMarker) {
        if (!lastSegment || !lastSegment.isSelected) {
            paragraph.segments.push(newSegment);
        }
    } else {
        if (
            newSegment.isSelected &&
            lastSegment?.type == ContentModel_SegmentType.SelectionMarker
        ) {
            paragraph.segments.pop();
        }

        paragraph.segments.push(newSegment);
    }
}

function addBlock(group: ContentModel_BlockGroup, block: ContentModel_Block) {
    group.blocks.push(block);
}
