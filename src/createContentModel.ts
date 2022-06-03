import getTagOfNode from './roosterjs/getTagOfNode';
import safeInstanceOf from './roosterjs/safeInstanceOf';
import { Alignment } from './roosterjs/Alignment';
import { Direction } from './roosterjs/Direction';
import {
    Block,
    BlockFormat,
    ContentModel,
    Segment,
    SegmentFormat,
    SelectionType,
    VerticalAlign,
} from './ContentMode';

export default function createContentModel(input: Node | string): ContentModel {
    const root =
        typeof input == 'string' ? new DOMParser().parseFromString(input, 'text/html').body : input;
    const contentModel: ContentModel = {
        blocks: [],
    };

    let range: Range;
    try {
        range = document.getSelection().getRangeAt(0);
    } catch {}

    range = range || document.createRange();

    addBlock(contentModel, {}, {});
    processNode(contentModel, root, {}, {}, range);
    normalizeModel(contentModel);

    return contentModel;
}

function normalizeModel(model: ContentModel) {
    for (let i = model.blocks.length - 1; i >= 0; i--) {
        const block = model.blocks[i];

        for (let j = block.segments.length - 1; j >= 0; j--) {
            if (isEmptySegment(block.segments[j])) {
                block.segments.splice(j, 1);
            }
        }

        if (isEmptyBlock(block)) {
            model.blocks.splice(i, 1);
        }
    }
}

function isEmptySegment(segment: Segment) {
    return !segment.text && segment.selection === undefined;
}

function isEmptyBlock(block: Block) {
    return block.segments.length == 0;
}

function processNode(
    model: ContentModel,
    node: Node,
    blockFormat: BlockFormat,
    segmentFormat: SegmentFormat,
    range: Range
) {
    if (safeInstanceOf(node, 'HTMLElement')) {
        switch (getTagOfNode(node)) {
            case 'DIV':

            // TODO
            case 'P':
            case 'BR':
            case 'OL':
            case 'UL':
            case 'LI':
                processElement(model, node, 'block', blockFormat, segmentFormat, range);

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
                processElement(model, node, 'inline', blockFormat, segmentFormat, range);
                break;

            case 'BODY':
                processChildren(model, node, blockFormat, segmentFormat, range);
                break;
        }
    } else if (safeInstanceOf(node, 'Text')) {
        let txt = node.nodeValue;
        let startOffset = range.startContainer == node ? range.startOffset : -1;
        let endOffset = range.endContainer == node ? range.endOffset : -1;

        if (startOffset >= 0) {
            const block = processText(model, txt.substring(0, startOffset));
            processSelection(model.blocks[model.blocks.length - 1], segmentFormat, true);

            addSegment(block, segmentFormat);

            txt = txt.substring(startOffset);
            endOffset -= startOffset;
        }

        if (endOffset >= 0) {
            const block = processText(model, txt.substring(0, endOffset));
            processSelection(model.blocks[model.blocks.length - 1], segmentFormat, false);

            addSegment(block, segmentFormat);
            txt = txt.substring(endOffset);
        }

        processText(model, txt);
    } else {
    }
}

function processText(model: ContentModel, text: string): Block {
    const lastBlock = model.blocks[model.blocks.length - 1];
    const lastSegment = lastBlock.segments[lastBlock.segments.length - 1];
    lastSegment.text += text;

    return lastBlock;

    // if (!/^[\r\n]*$/.test(nodeValue)) {
    // } else if (lastSegment.text) {
    //     lastSegment.text += ' ';
    // }
}

function processElement(
    model: ContentModel,
    node: HTMLElement,
    displayDefault: string,
    blockFormat: BlockFormat,
    segmentFormat: SegmentFormat,
    range: Range
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
            processSegment(model, node, blockFormat, segmentFormat, range);
            break;
        case 'block':
        case 'flex':
        case 'grid':
            processBlock(model, node, blockFormat, segmentFormat, range);
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

function processSegment(
    model: ContentModel,
    node: HTMLElement,
    blockFormat: BlockFormat,
    segmentFormat: SegmentFormat,
    range: Range
) {
    const lastBlock = model.blocks[model.blocks.length - 1];
    const format = getSegmentFormat(node, segmentFormat);
    addSegment(lastBlock, format);

    processChildren(model, node, blockFormat, format, range);
    addSegment(lastBlock, segmentFormat);
}

function processBlock(
    model: ContentModel,
    node: HTMLElement,
    blockFormat: BlockFormat,
    segmentFormat: SegmentFormat,
    range: Range
) {
    const format = getBlockFormat(node, blockFormat);
    addBlock(model, format, segmentFormat);

    processChildren(model, node, format, segmentFormat, range);
    addBlock(model, blockFormat, segmentFormat);
}

function processChildren(
    model: ContentModel,
    parent: HTMLElement,
    blockFormat: BlockFormat,
    segmentFormat: SegmentFormat,
    range: Range
) {
    const startOffset = range.startContainer == parent ? range.startOffset : -1;
    const endOffset = range.endContainer == parent ? range.endOffset : -1;
    let index = 0;

    for (let child = parent.firstChild; child; child = child.nextSibling) {
        if (index == startOffset) {
            processSelection(model.blocks[model.blocks.length - 1], segmentFormat, true);
        }
        if (index == endOffset) {
            processSelection(model.blocks[model.blocks.length - 1], segmentFormat, false);
        }
        processNode(model, child, blockFormat, segmentFormat, range);
        index++;
    }
}

function processSelection(block: Block, format: SegmentFormat, isStart: boolean) {
    const segment = addSegment(block, {});
    segment.selection = isStart ? SelectionType.Start : SelectionType.End;
}

function addSegment(block: Block, format: SegmentFormat): Segment {
    const segmentFormat = { ...format };

    const newSegment: Segment = {
        text: '',
        format: segmentFormat,
    };
    block.segments.push(newSegment);
    return newSegment;
}

function addBlock(model: ContentModel, format: BlockFormat, segmentFormat: SegmentFormat): Block {
    const blockFormat = { ...format };
    const newBlock: Block = {
        segments: [],
        format: blockFormat,
    };

    model.blocks.push(newBlock);

    addSegment(newBlock, segmentFormat);

    return newBlock;
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

function getSegmentFormat(node: HTMLElement, parentFormat: SegmentFormat) {
    const result = { ...parentFormat };
    const tag = getTagOfNode(node);

    if (node.style.fontFamily) {
        result.font = node.style.fontFamily;
    }

    if (node.style.fontSize) {
        result.size = node.style.fontSize;
    }

    if (node.style.color) {
        result.color = node.style.color;
    }

    if (tag == 'A' && (<HTMLAnchorElement>node).href) {
        result.href = node.getAttribute('href');
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
        style => (result.strikeThrough = style == 'line-through')
    );

    getEffectiveStyle(
        node.style.verticalAlign,
        tag,
        ['SUB', 'SUP'],
        tag => (tag == 'SUB' ? 'sub' : 'sup'),
        style =>
            (result.verticalAlign =
                style === 'sub'
                    ? VerticalAlign.Subscript
                    : style == 'sup'
                    ? VerticalAlign.Superscript
                    : VerticalAlign.None)
    );

    if (node.style.backgroundColor) {
        result.backgroundColor = node.style.backgroundColor;
    } else if (node.style.background) {
        // TODO
    }

    return result;
}

function getBlockFormat(node: HTMLElement, parentFormat: BlockFormat) {
    const result = {
        ...parentFormat,
    };

    const dir = node.dir || node.style.direction;
    if (dir) {
        result.direction = dir == 'rtl' ? Direction.RightToLeft : Direction.LeftToRight;
    }

    const align = node.style.textAlign;
    if (align) {
        result.align =
            align == 'right'
                ? Alignment.Right
                : align == 'center'
                ? Alignment.Center
                : Alignment.Left;
    }

    const indentation = node.style.textIndent;
    if (indentation) {
        result.indentation = indentation;
    }

    return result;
}
