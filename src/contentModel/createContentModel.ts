import { getTagOfNode, safeInstanceOf, toArray } from 'roosterjs-editor-dom';
import {
    ContentModel_Segment,
    ContentModel_SegmentFormat,
    ContentModel_SegmentType,
    ContentModel_Text,
} from './Segment';
import {
    ContentModel_BlockGroupType,
    ContentModel_ParagraphFormat,
    ContentModel_BlockType,
    ContentModel_Document,
    ContentModel_BlockGroup,
    ContentModel_Block,
    ContentModel_Paragraph,
    ContentModel_Table,
    ContentModel_TableCell,
} from './Block';

interface FormatContext {
    blockFormat: ContentModel_ParagraphFormat;
    segmentFormat: ContentModel_SegmentFormat;
    isInSelection: boolean;
    range: Range | null;
}

export default function createContentModel(
    input: Node | string,
    range: Range
): ContentModel_Document {
    const root =
        typeof input == 'string' ? new DOMParser().parseFromString(input, 'text/html').body : input;
    const contentModel: ContentModel_Document = {
        blockGroupType: ContentModel_BlockGroupType.Document,
        blockType: ContentModel_BlockType.BlockGroup,
        blocks: [],
    };
    const formatContext: FormatContext = {
        blockFormat: {},
        segmentFormat: {},
        isInSelection: false,
        range,
    };

    addParagraph(contentModel, formatContext);
    processChildren(contentModel, root, formatContext);
    normalizeModel(contentModel);

    return contentModel;
}

function normalizeModel(group: ContentModel_BlockGroup) {
    for (let i = group.blocks.length - 1; i >= 0; i--) {
        const block = group.blocks[i];

        switch (block.blockType) {
            case ContentModel_BlockType.BlockGroup:
                normalizeModel(block);
                break;
            case ContentModel_BlockType.List:
                for (let j = 0; j < block.listItems.length; j++) {
                    normalizeModel(block.listItems[j]);
                }
                break;
            case ContentModel_BlockType.Paragraph:
                for (let j = block.segments.length - 1; j >= 0; j--) {
                    if (isEmptySegment(block.segments[j])) {
                        block.segments.splice(j, 1);
                    }
                }
                break;
            case ContentModel_BlockType.Table:
                for (let r = 0; r < block.cells.length; r++) {
                    for (let c = 0; c < block.cells[r].length; c++) {
                        normalizeModel(block.cells[r][c]);
                    }
                }
                break;
        }

        if (isEmptyBlock(block)) {
            group.blocks.splice(i, 1);
        }
    }
}

function isEmptySegment(segment: ContentModel_Segment) {
    return (
        segment.type == ContentModel_SegmentType.Text &&
        (!segment.text || /^[\r\n]*$/.test(segment.text)) &&
        !segment.alwaysKeep
    );
}

function isEmptyBlock(block: ContentModel_Block) {
    return block.blockType == ContentModel_BlockType.Paragraph && block.segments.length == 0;
}

function processNode(group: ContentModel_BlockGroup, node: Node, context: FormatContext) {
    if (safeInstanceOf(node, 'HTMLElement')) {
        switch (getTagOfNode(node)) {
            case 'DIV':

            // TODO
            case 'P':
            case 'OL':
            case 'UL':
            case 'LI':
                processElement(group, node, 'block', context);
                break;

            case 'BR':
                processBr(group, context);
                break;
            case 'SPAN':
            case 'FONT':
            case 'A':
            case 'B':
            case 'STRONG':
            case 'I':
            case 'EM':
            case 'U':
            case 'SUB':
            case 'SUP':
            case 'S':
            case 'STRIKE':
                processElement(group, node, 'inline', context);
                break;

            case 'BODY':
                processChildren(group, node, context);
                break;

            case 'TABLE':
                processTable(group, node as HTMLTableElement, context);
                break;

            case 'TD':
            case 'FONT':
            case 'TR':
            case 'TBODY':
            case 'IMG':
            case 'PRE':
            case 'H1':
            case 'H2':
            case 'H3':
            case 'H4':
            case 'H5':
            case 'H6':
            case 'CODE':
            case 'CENTER':
            case 'BLOCKQUOTE':
            case 'STYLE':
            case 'HR':
                // TODO
                break;
        }
    } else if (safeInstanceOf(node, 'Text')) {
        const paragraph = getOrAddParagraph(group, context);

        let txt = node.nodeValue;
        let startOffset =
            context.range && context.range.startContainer == node ? context.range.startOffset : -1;
        let endOffset =
            context.range && context.range.endContainer == node ? context.range.endOffset : -1;

        if (startOffset >= 0) {
            processText(paragraph, txt.substring(0, startOffset), context);
            context.isInSelection = true;

            const seg = addTextSegment(paragraph, context);
            seg.alwaysKeep = true;

            txt = txt.substring(startOffset);
            endOffset -= startOffset;
        }

        if (endOffset >= 0) {
            addTextSegment(paragraph, context);

            processText(paragraph, txt.substring(0, endOffset), context);
            context.isInSelection = false;

            addTextSegment(paragraph, context);
            txt = txt.substring(endOffset);
        }

        processText(paragraph, txt, context);
    } else {
    }
}

function processTable(
    group: ContentModel_BlockGroup,
    node: HTMLTableElement,
    context: FormatContext
) {
    const table: ContentModel_Table = {
        blockType: ContentModel_BlockType.Table,
        cells: toArray(node.rows).map(_ => []),
    };

    group.blocks.push(table);

    for (let row = 0; row < node.rows.length; row++) {
        const tr = node.rows[row];
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

                    addParagraph(cell, context);

                    table.cells[row + rowSpan][targetCol] = cell;

                    if (hasTd) {
                        processChildren(cell, td, context);
                    }
                }
            }
        }
    }
}

function processText(paragraph: ContentModel_Paragraph, text: string, context: FormatContext) {
    const textSegment = getOrAddTextSegment(paragraph, context);
    textSegment.text += text;

    // return lastBlock;

    // if (!/^[\r\n]*$/.test(nodeValue)) {
    // } else if (lastSegment.text) {
    //     lastSegment.text += ' ';
    // }
}

function processBr(group: ContentModel_BlockGroup, context: FormatContext) {
    const p = getOrAddParagraph(group, context);
    const seg = getOrAddTextSegment(p, context);

    if (isEmptySegment(seg)) {
        seg.alwaysKeep = true;
    }

    addParagraph(group, context);
}

function processElement(
    group: ContentModel_BlockGroup,
    node: HTMLElement,
    displayDefault: string,
    context: FormatContext
) {
    const display = node.style.display || displayDefault;

    // https://www.w3schools.com/cssref/pr_class_display.asp
    switch (display) {
        case 'inline':
        case 'inline-block':
        case 'inline-flex':
        case 'inline-grid':
        case 'inline-table':
        case 'contents':
            processSegment(group, node, context);
            break;
        case 'block':
        case 'flex':
        case 'grid':
            processBlock(group, node, context);
            break;

        case 'list-item':
            break;
        case 'table':
        case 'table-caption':
        case 'table-column-group':
        case 'table-header-group':
        case 'table-footer-group':
        case 'table-row-group':
        case 'table-cell':
        case 'table-column':
        case 'table-row':
            // TODO
            break;

        case 'run-in':
        case 'initial':
            break;

        case 'none':
            break;
    }
}

function processSegment(group: ContentModel_BlockGroup, node: HTMLElement, context: FormatContext) {
    const paragraph = getOrAddParagraph(group, context);
    const originalSegmentFormat = context.segmentFormat;

    context.segmentFormat = getSegmentFormat(node, context);

    addTextSegment(paragraph, context);
    processChildren(group, node, context);

    context.segmentFormat = originalSegmentFormat;
    addTextSegment(paragraph, context);
}

function processBlock(group: ContentModel_BlockGroup, node: HTMLElement, context: FormatContext) {
    const originalBlockFormat = context.blockFormat;

    context.blockFormat = getBlockFormat(node, context);
    addParagraph(group, context);
    processChildren(group, node, context);
    context.blockFormat = originalBlockFormat;

    addParagraph(group, context);
}

function processChildren(group: ContentModel_BlockGroup, parent: Node, context: FormatContext) {
    const startOffset =
        context.range && context.range.startContainer == parent ? context.range.startOffset : -1;
    const endOffset =
        context.range && context.range.endContainer == parent ? context.range.endOffset : -1;
    const paragraph = getOrAddParagraph(group, context);
    let index = 0;

    for (let child = parent.firstChild; child; child = child.nextSibling) {
        if (index == startOffset) {
            context.isInSelection = true;
            const seg = addTextSegment(paragraph, context);
            seg.alwaysKeep = true;
        }

        if (index == endOffset) {
            const seg = addTextSegment(paragraph, context);
            seg.alwaysKeep = true;
            context.isInSelection = false;
            addTextSegment(paragraph, context);
        }
        processNode(group, child, context);
        index++;
    }
}

function getEffectiveStyle<T>(
    cssStyle: string,
    tag: string,
    tagsToCheck: string[],
    tagToStyle: string | ((tag: string) => string),
    styleCallback: (style: string) => void
) {
    const style =
        cssStyle ||
        (tagsToCheck.indexOf(tag) >= 0
            ? typeof tagToStyle == 'function'
                ? tagToStyle(tag)
                : tagToStyle
            : null);
    if (style) {
        styleCallback(style);
    }
}

function getSegmentFormat(node: HTMLElement, context: FormatContext) {
    const result = { ...context.segmentFormat };
    const tag = getTagOfNode(node);

    if (node.style.fontFamily) {
        result.fontFamily = node.style.fontFamily;
    }

    if (node.style.fontSize) {
        result.fontSize = node.style.fontSize;
    }

    if (node.style.color) {
        result.color = node.style.color;
    }

    if (tag == 'A' && (<HTMLAnchorElement>node).href) {
        result.linkHref = node.getAttribute('href');
    }

    getEffectiveStyle(
        node.style.fontWeight,
        tag,
        ['B', 'STRONG'],
        'bold',
        style => (result.bold = parseInt(style) >= 700 || ['bold', 'bolder'].indexOf(style) >= 0)
    );

    getEffectiveStyle(
        node.style.fontStyle,
        tag,
        ['I', 'EM'],
        'italic',
        style => (result.italic = style == 'italic')
    );

    getEffectiveStyle(
        node.style.textDecoration,
        tag,
        ['U'],
        'underline',
        style => (result.underline = style.indexOf('underline') >= 0)
    );

    getEffectiveStyle(
        node.style.textDecoration,
        tag,
        ['S', 'STRIKE'],
        'line-through',
        style => (result.strikethrough = style == 'line-through')
    );

    // getEffectiveStyle(
    //     node.style.verticalAlign,
    //     tag,
    //     ['SUB', 'SUP'],
    //     tag => (tag == 'SUB' ? 'sub' : 'sup'),
    //     style =>
    //         (result.verticalAlign =
    //             style === 'sub'
    //                 ? VerticalAlign.Subscript
    //                 : style == 'sup'
    //                 ? VerticalAlign.Superscript
    //                 : VerticalAlign.None)
    // );

    if (node.style.backgroundColor) {
        result.backgroundColor = node.style.backgroundColor;
    } else if (node.style.background) {
        // TODO
    }

    return result;
}

function getBlockFormat(node: HTMLElement, context: FormatContext) {
    const tag = getTagOfNode(node);
    const result = {
        ...context.blockFormat,
    };

    const dir = node.dir || node.style.direction;
    if (dir) {
        result.direction = dir == 'rtl' ? 'rtl' : 'ltr';
    }

    const align = node.style.textAlign;
    if (align) {
        result.alignment = align == 'right' ? 'right' : align == 'center' ? 'center' : 'right';
    }

    let marginTop = node.style.marginTop;
    let marginBottom = node.style.marginBottom;

    if (tag == 'P') {
        if (!marginTop) {
            marginTop = '1em';
        }
        if (!marginBottom) {
            marginBottom = '1em';
        }
    }
    if (marginTop) {
        result.marginTop = marginTop;
    }
    if (marginBottom) {
        result.marginBottom = marginBottom;
    }

    const indentation = node.style.textIndent;
    if (indentation) {
        result.indentation = indentation;
    }

    return result;
}

function getOrAddParagraph(
    group: ContentModel_BlockGroup,
    context: FormatContext
): ContentModel_Paragraph {
    const lastBlock = group.blocks[group.blocks.length - 1];

    return lastBlock.blockType == ContentModel_BlockType.Paragraph
        ? lastBlock
        : addParagraph(group, context);
}

function getOrAddTextSegment(
    paragraph: ContentModel_Paragraph,
    context: FormatContext
): ContentModel_Text {
    const lastSegment = paragraph.segments[paragraph.segments.length - 1];
    return lastSegment.type == ContentModel_SegmentType.Text
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

    addTextSegment(paragraph, context);

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
