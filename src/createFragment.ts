import wrap from './roosterjs/wrap';
import { Alignment } from './roosterjs/Alignment';
import { Block, ContentModel, Segment, SegmentFormat, VerticalAlign } from './ContentMode';
import { Direction } from './roosterjs/Direction';

export default function createFragment(
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
