import getTagOfNode from './roosterjs/getTagOfNode';
import safeInstanceOf from './roosterjs/safeInstanceOf';
import wrap from './roosterjs/wrap';
import { Alignment } from './roosterjs/Alignment';
import { Direction } from './roosterjs/Direction';

export interface ContentModelItem {}

export const enum VerticalAlign {
    None,
    Superscript,
    Subscript,
}

export const enum SelectionType {
    Start,
    End,
}

export interface SegmentFormat extends ContentModelItem {
    font?: string;
    size?: string;
    color?: string;
    backgroundColor?: string;

    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikeThrough?: boolean;
    verticalAlign?: VerticalAlign;

    href?: string;
}

export interface BlockFormat extends ContentModelItem {
    align?: Alignment;
    direction?: Direction;
    indentation?: string;
}

export interface Segment extends ContentModelItem {
    text: string;
    format: SegmentFormat;
    selection?: SelectionType;
}

export interface Block extends ContentModelItem {
    segments: Segment[];
    format: BlockFormat;
}

// interface ListItem extends ContentModelItem {
//     listType: ListType[];
//     child: Block;
// }

export interface ContentModel {
    blocks: Block[];
}

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

export function createFragment(
    model: ContentModel,
    doc: Document,
    range?: Range
): DocumentFragment {
    const fragment = doc.createDocumentFragment();
    model.blocks.forEach(block => createBlockFromContentModel(fragment, block, range));
    return fragment;
}

function createBlockFromContentModel(parent: Node, block: Block, range?: Range) {
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

    let previousSegment: Segment | null = null;
    let previousSpan: HTMLSpanElement | null = null;
    block.segments.forEach(segment => {
        if (segment.selection === undefined) {
            previousSpan = createSegmentFromContent(div, segment, previousSegment, previousSpan);

            previousSegment = segment;
        } else {
            // Handle selection
        }
    });
}

function areSameFormats(f1: SegmentFormat, f2: SegmentFormat) {
    return (
        f1.font == f2.font &&
        f1.size == f2.size &&
        f1.backgroundColor == f2.backgroundColor &&
        f1.bold == f2.bold &&
        f1.italic == f2.italic &&
        f1.underline == f2.underline &&
        f1.strikeThrough == f2.strikeThrough &&
        f1.verticalAlign == f2.verticalAlign &&
        f1.href == f2.href
    );
}

function createSegmentFromContent(
    parent: Node,
    segment: Segment,
    previousSegment: Segment | null,
    previousSpan: HTMLSpanElement | null
) {
    if (previousSegment && previousSpan && areSameFormats(segment.format, previousSegment.format)) {
        previousSpan.textContent += segment.text;
        return previousSpan;
    } else {
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
            href,
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

        if (href) {
            const a = wrap(span, 'A') as HTMLAnchorElement;
            a.href = href;
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

        return span;
    }
}
