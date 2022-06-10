import { DefaultFormatParserType } from './defaultStyles';
import { ParagraphFormatHandlers, SegmentFormatHandlers } from './formatHandlers';
import { toArray } from 'roosterjs-editor-dom';
import {
    ContentModel_SegmentFormat,
    ContentModel_Text,
    ContentModel_SegmentType,
    ContentModel_Image,
} from './types/Segment';
import {
    ContentModel_BlockGroup,
    ContentModel_ParagraphFormat,
    ContentModel_Table,
    ContentModel_BlockType,
    ContentModel_Paragraph,
    ContentModel_TableCell,
    ContentModel_BlockGroupType,
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
    const paragraph = getOrAddParagraph(group, context);

    let startOffset = context.startContainer == parent ? context.startOffset : -1;
    let endOffset = context.endContainer == parent ? context.endOffset : -1;
    let index = 0;

    for (let child = parent.firstChild; child; child = child.nextSibling) {
        if (index == startOffset) {
            context.isInSelection = true;
            const seg = addTextSegment(paragraph, context);
            // seg.alwaysKeep = true;
        }

        if (index == endOffset) {
            const seg = addTextSegment(paragraph, context);
            // seg.alwaysKeep = true;
            context.isInSelection = false;
            addTextSegment(paragraph, context);
        }

        switch (child.nodeType) {
            case Node.ELEMENT_NODE:
                const element = child as HTMLElement;
                const handler = context.tagHandlers[element.tagName];

                if (handler) {
                    const format =
                        typeof handler.style === 'function'
                            ? handler.style(element)
                            : handler.style;
                    handler.processor(group, context, element, format || {});
                }
                break;

            case Node.TEXT_NODE:
                const textNode = child as Text;
                const paragraph = getOrAddParagraph(group, context);

                let txt = textNode.nodeValue;
                startOffset = context.startContainer == textNode ? context.startOffset : -1;
                endOffset = context.endContainer == textNode ? context.endOffset : -1;

                if (startOffset >= 0) {
                    textProcessor(paragraph, txt.substring(0, startOffset), context);
                    context.isInSelection = true;

                    const seg = addTextSegment(paragraph, context);
                    // seg.alwaysKeep = true;

                    txt = txt.substring(startOffset);
                    endOffset -= startOffset;
                }

                if (endOffset >= 0) {
                    addTextSegment(paragraph, context);

                    textProcessor(paragraph, txt.substring(0, endOffset), context);
                    context.isInSelection = false;

                    addTextSegment(paragraph, context);
                    txt = txt.substring(endOffset);
                }

                textProcessor(paragraph, txt, context);
                break;
        }

        index++;
    }
}

export const generalProcessor: ElementProcessor = (group, context, element, defaultStyle) => {
    const processor =
        BlockDisplay.indexOf(element.style.display || defaultStyle.display) >= 0
            ? segmentProcessor
            : blockProcessor;

    processor(group, context, element, defaultStyle);
};

export const brProcessor: ElementProcessor = (group, context) => {
    const paragraph = getOrAddParagraph(group, context);
    const segment = getOrAddTextSegment(paragraph, context);

    // if (isEmptySegment(seg)) {
    // seg.alwaysKeep = true;
    // }

    addParagraph(group, context);
};

export const tableProcessor: ElementProcessor = (group, context, element) => {
    const tableElement = element as HTMLTableElement;
    const table: ContentModel_Table = {
        blockType: ContentModel_BlockType.Table,
        cells: toArray(tableElement.rows).map(_ => []),
    };

    group.blocks.push(table);

    for (let row = 0; row < tableElement.rows.length; row++) {
        const tr = tableElement.rows[row];
        for (let sourceCol = 0, targetCol = 0; sourceCol < tr.cells.length; sourceCol++) {
            for (; table.cells[row][targetCol]; targetCol++) {}

            const td = tr.cells[sourceCol];

            for (let colSpan = 0; colSpan < td.colSpan; colSpan++, targetCol++) {
                for (let rowSpan = 0; rowSpan < td.rowSpan; rowSpan++) {
                    const hasTd = colSpan + rowSpan == 0;
                    const cell: ContentModel_TableCell = {
                        blockGroupType: ContentModel_BlockGroupType.TableCell,
                        blockType: ContentModel_BlockType.BlockGroup,
                        blocks: [],
                        // td: hasTd ? td : null,
                        spanLeft: colSpan > 0,
                        spanAbove: rowSpan > 0,
                    };

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
    const segmentFormat = { ...context.segmentFormat };

    SegmentFormatHandlers.forEach(handler =>
        handler.parse(segmentFormat, imageElement, defaultStyle)
    );

    const image: ContentModel_Image = {
        type: ContentModel_SegmentType.Image,
        format: segmentFormat,
        src: imageElement.src,
        isSelected: context.isInSelection,
    };

    let paragraph = getOrAddParagraph(group, context);
    paragraph.segments.push(image);
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

    addParagraph(group, context);
    containerProcessor(group, element, context);
    context.blockFormat = originalBlockFormat;
    context.segmentFormat = originalSegmentFormat;

    addParagraph(group, context);
};

const segmentProcessor: ElementProcessor = (group, context, element, defaultStyle) => {
    const originalSegmentFormat = context.segmentFormat;

    context.segmentFormat = { ...originalSegmentFormat };
    SegmentFormatHandlers.forEach(handler =>
        handler.parse(context.segmentFormat, element, defaultStyle)
    );

    let paragraph = getOrAddParagraph(group, context);
    addTextSegment(paragraph, context);
    containerProcessor(group, element, context);

    paragraph = getOrAddParagraph(group, context);
    context.segmentFormat = originalSegmentFormat;
    addTextSegment(paragraph, context);
};

function textProcessor(paragraph: ContentModel_Paragraph, text: string, context: FormatContext) {
    const textSegment = getOrAddTextSegment(paragraph, context);
    textSegment.text += text;

    // return lastBlock;

    // if (!/^[\r\n]*$/.test(nodeValue)) {
    // } else if (lastSegment.text) {
    //     lastSegment.text += ' ';
    // }
}

function getOrAddParagraph(
    group: ContentModel_BlockGroup,
    context: FormatContext
): ContentModel_Paragraph {
    const lastBlock = group.blocks[group.blocks.length - 1];

    return lastBlock?.blockType == ContentModel_BlockType.Paragraph
        ? lastBlock
        : addParagraph(group, context);
}

function getOrAddTextSegment(
    paragraph: ContentModel_Paragraph,
    context: FormatContext
): ContentModel_Text {
    const lastSegment = paragraph.segments[paragraph.segments.length - 1];
    return lastSegment?.type == ContentModel_SegmentType.Text
        ? lastSegment
        : addTextSegment(paragraph, context);
}

function addParagraph(
    group: ContentModel_BlockGroup,
    context: FormatContext
): ContentModel_Paragraph {
    const blockFormat = {
        ...context.blockFormat,
    };
    const paragraph: ContentModel_Paragraph = {
        blockType: ContentModel_BlockType.Paragraph,
        segments: [],
        format: blockFormat,
    };

    group.blocks.push(paragraph);

    return paragraph;
}

function addTextSegment(
    paragraph: ContentModel_Paragraph,
    context: FormatContext
): ContentModel_Text {
    const segmentFormat = { ...context.segmentFormat };
    const newSegment: ContentModel_Text = {
        type: ContentModel_SegmentType.Text,
        text: '',
        format: segmentFormat,
        isSelected: context.isInSelection,
    };

    paragraph.segments.push(newSegment);

    return newSegment;
}
