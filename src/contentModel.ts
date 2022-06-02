import getTagOfNode from './roosterjs/getTagOfNode';
import safeInstanceOf from './roosterjs/safeInstanceOf';
import wrap from './roosterjs/wrap';
import { Alignment } from './roosterjs/Alignment';
import { Direction } from './roosterjs/Direction';

interface ContentStateItem {}

const enum VerticalAlign {
    None,
    Superscript,
    Subscript,
}

interface SegmentFormat extends ContentStateItem {
    font?: string;
    size?: string;
    color?: string;
    backgroundColor?: string;

    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikeThrough?: boolean;
    verticalAlign?: VerticalAlign;
}

interface BlockFormat extends ContentStateItem {
    align?: Alignment;
    direction?: Direction;
    indentation?: string;
}

interface Segment extends ContentStateItem {
    text: string;
    format: SegmentFormat;
}

interface Block extends ContentStateItem {
    segments: Segment[];
    format: BlockFormat;
}

// interface ListItem extends ContentStateItem {
//     listType: ListType[];
//     child: Block;
// }

interface ContentState {
    blocks: Block[];
}

export default function createContentModel(input: Node | string): ContentState {
    const root =
        typeof input == 'string' ? new DOMParser().parseFromString(input, 'text/html').body : input;
    const contentState: ContentState = {
        blocks: [],
    };

    addBlock(contentState, {}, {});
    processNode(contentState, root, {}, {});
    normalizeState(contentState);

    return contentState;
}

function normalizeState(state: ContentState) {
    for (let i = state.blocks.length - 1; i >= 0; i--) {
        const block = state.blocks[i];

        for (let j = block.segments.length - 1; j >= 0; j--) {
            if (isEmptySegment(block.segments[j])) {
                block.segments.splice(j, 1);
            }
        }

        if (isEmptyBlock(block)) {
            state.blocks.splice(i, 1);
        }
    }
}

function isEmptySegment(segment: Segment) {
    return !segment.text;
}

function isEmptyBlock(block: Block) {
    return block.segments.length == 0;
}

function processNode(
    state: ContentState,
    node: Node,
    blockFormat: BlockFormat,
    segmentFormat: SegmentFormat
) {
    if (safeInstanceOf(node, 'HTMLElement')) {
        switch (getTagOfNode(node)) {
            case 'DIV':
                processElement(state, node, 'block', blockFormat, segmentFormat);

                break;
            case 'SPAN':
            case 'B':
            case 'STRONG':
            case 'I':
            case 'EM':
            case 'U':
            case 'SUB':
            case 'SUP':
            case 'S':
            case 'STRIKE':
                processElement(state, node, 'inline', blockFormat, segmentFormat);
                break;

            case 'BODY':
                processChildren(state, node, blockFormat, segmentFormat);
                break;
        }
    } else if (safeInstanceOf(node, 'Text')) {
        processText(state, node, segmentFormat);
    } else {
    }
}

function processText(state: ContentState, text: Text, segmentFormat: SegmentFormat) {
    const lastBlock = state.blocks[state.blocks.length - 1];
    const lastSegment = lastBlock.segments[lastBlock.segments.length - 1];
    lastSegment.text += text.nodeValue;
}

function processElement(
    state: ContentState,
    node: HTMLElement,
    displayDefault: string,
    blockFormat: BlockFormat,
    segmentFormat: SegmentFormat
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
            processSegment(state, node, blockFormat, segmentFormat);
            break;
        case 'block':
        case 'flex':
        case 'grid':
            processBlock(state, node, blockFormat, segmentFormat);
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
    state: ContentState,
    node: HTMLElement,
    blockFormat: BlockFormat,
    segmentFormat: SegmentFormat
) {
    const lastBlock = state.blocks[state.blocks.length - 1];
    const format = getSegmentFormat(node, segmentFormat);
    addSegment(lastBlock, format);

    processChildren(state, node, blockFormat, format);
    addSegment(lastBlock, segmentFormat);
}

function processBlock(
    state: ContentState,
    node: HTMLElement,
    blockFormat: BlockFormat,
    segmentFormat: SegmentFormat
) {
    const format = getBlockFormat(node, blockFormat);
    addBlock(state, format, segmentFormat);

    processChildren(state, node, format, segmentFormat);
    addBlock(state, blockFormat, segmentFormat);
}

function processChildren(
    state: ContentState,
    parent: HTMLElement,
    blockFormat: BlockFormat,
    segmentFormat: SegmentFormat
) {
    for (let child = parent.firstChild; child; child = child.nextSibling) {
        processNode(state, child, blockFormat, segmentFormat);
    }
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

function addBlock(state: ContentState, format: BlockFormat, segmentFormat: SegmentFormat): Block {
    const blockFormat = { ...format };

    const newBlock: Block = {
        segments: [],
        format: blockFormat,
    };

    state.blocks.push(newBlock);

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

    getEffectiveStyle(
        node.style.fontWeight,
        tag,
        ['B'],
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

export function createFragment(state: ContentState, doc: Document): DocumentFragment {
    const fragment = doc.createDocumentFragment();
    state.blocks.forEach(block => createBlockFromContentState(fragment, block));
    return fragment;
}

function createBlockFromContentState(parent: Node, block: Block) {
    const div = parent.ownerDocument.createElement('div');
    parent.appendChild(div);

    const { align, direction, indentation } = block.format;
    if (align !== undefined) {
        div.style.textAlign =
            align == Alignment.Right ? 'right' : align == Alignment.Center ? 'center' : 'left';
    }
    if (direction != undefined) {
        div.style.direction = direction == Direction.RightToLeft ? 'rtl' : 'ltr';
    }
    if (indentation != undefined) {
        div.style.textIndent = indentation;
    }

    block.segments.forEach(segment => createSegmentFromContent(div, segment));
}

function createSegmentFromContent(parent: Node, segment: Segment) {
    const doc = parent.ownerDocument;
    const span = doc.createElement('span');
    parent.appendChild(span);

    span.appendChild(doc.createTextNode(segment.text));

    const {
        font,
        size,
        color,
        backgroundColor,
        bold,
        italic,
        underline,
        strikeThrough,
        verticalAlign,
    } = segment.format;

    if (font) {
        span.style.fontFamily = font;
    }

    if (size) {
        span.style.fontSize = size;
    }

    if (color) {
        span.style.color = color;
    }

    if (backgroundColor) {
        span.style.backgroundColor = backgroundColor;
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

    if (strikeThrough) {
        // span.style.textDecoration += 'line-through ';
        wrap(span, 'STRIKE');
    }

    if (verticalAlign == VerticalAlign.Subscript) {
        wrap(span, 'SUB');
    } else if (verticalAlign == VerticalAlign.Superscript) {
        wrap(span, 'SUP');
    }

    //     span.style.verticalAlign =
    //         verticalAlign == VerticalAlign.Subscript
    //             ? 'sub'
    //             : verticalAlign == VerticalAlign.Superscript
    //             ? 'sup'
    //             : '';
    // }
}
