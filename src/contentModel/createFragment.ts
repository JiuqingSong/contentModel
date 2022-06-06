import { ContentModel_Block, ContentModel_BlockType, ContentModel_Document } from './Block';
import { wrap } from 'roosterjs-editor-dom';
import {
    ContentModel_Segment,
    ContentModel_SegmentFormat,
    ContentModel_SegmentType,
} from './Segment';

export interface SelectionContext {
    isInSelection: boolean;
    previousSelectionAnchor: HTMLElement | null;
    startContainer?: Node;
    endContainer?: Node;
    startOffset?: number;
    endOffset?: number;
}

export default function createFragment(
    model: ContentModel_Document,
    doc: Document
): [DocumentFragment, SelectionContext] {
    const fragment = doc.createDocumentFragment();
    const context: SelectionContext = {
        isInSelection: false,
        previousSelectionAnchor: null,
    };
    model.blocks.forEach(block => createBlockFromContentModel(fragment, block, context));

    if (context.startContainer && !context.endContainer) {
        if (context.previousSelectionAnchor) {
            context.endContainer = context.previousSelectionAnchor;
            context.endOffset = context.endContainer.textContent.length;
        } else {
            context.startContainer = undefined;
            context.startOffset = undefined;
        }

        context.previousSelectionAnchor = null;
    }

    return [fragment, context];
}

function createBlockFromContentModel(
    parent: Node,
    block: ContentModel_Block,
    context: SelectionContext
) {
    const doc = parent.ownerDocument;

    switch (block.blockType) {
        case ContentModel_BlockType.Paragraph:
            const div = doc.createElement('div');
            parent.appendChild(div);

            const { alignment, direction, indentation, marginBottom, marginTop } = block.format;
            if (alignment !== undefined) {
                div.style.textAlign = alignment;
            }
            if (direction != undefined) {
                div.style.direction = direction;
            }
            if (indentation != undefined) {
                div.style.textIndent = indentation;
            }
            if (marginTop) {
                div.style.marginTop = marginTop;
            }
            if (marginBottom) {
                div.style.marginBottom = marginBottom;
            }

            let previousSegment: ContentModel_Segment | null = null;
            let previousSpan: HTMLElement | null = null;

            block.segments.forEach(segment => {
                let pendingStartContainer = false;

                if (segment.isSelected && !context.isInSelection) {
                    context.isInSelection = true;
                    context.startOffset = previousSpan?.textContent.length || 0;
                    context.startContainer = previousSpan;
                    pendingStartContainer = true;
                } else if (!segment.isSelected && context.isInSelection) {
                    context.isInSelection = false;
                    context.endContainer = context.previousSelectionAnchor;
                    context.endOffset = context.previousSelectionAnchor?.textContent.length || 0;
                }

                const newSpan = createSegmentFromContent(
                    div,
                    segment,
                    previousSegment,
                    previousSpan
                );

                previousSegment = segment;

                if (pendingStartContainer) {
                    if (context.startContainer != newSpan) {
                        context.startOffset = 0;
                    }

                    context.startContainer = newSpan;
                }

                if (context.isInSelection) {
                    context.previousSelectionAnchor = newSpan;
                }

                previousSpan = newSpan;
            });

            if (!div.textContent) {
                div.appendChild(doc.createElement('br'));
            }
    }
}

function areSameFormats(f1: ContentModel_SegmentFormat, f2: ContentModel_SegmentFormat) {
    return (
        f1.fontFamily == f2.fontFamily &&
        f1.fontSize == f2.fontSize &&
        f1.backgroundColor == f2.backgroundColor &&
        f1.bold == f2.bold &&
        f1.italic == f2.italic &&
        f1.underline == f2.underline &&
        f1.strikethrough == f2.strikethrough &&
        // f1.verticalAlign == f2.verticalAlign &&
        f1.linkHref == f2.linkHref &&
        f1.linkTarget == f1.linkTarget
    );
}

function createSegmentFromContent(
    parent: Node,
    segment: ContentModel_Segment,
    previousSegment: ContentModel_Segment | null,
    previousSpan: HTMLSpanElement | null
) {
    switch (segment.type) {
        case ContentModel_SegmentType.Text:
            if (
                previousSegment &&
                previousSpan &&
                areSameFormats(segment.format, previousSegment.format)
            ) {
                previousSpan.textContent += segment.text;
                return previousSpan;
            } else {
                const doc = parent.ownerDocument;
                const span = doc.createElement('span');

                parent.appendChild(span);
                span.appendChild(doc.createTextNode(segment.text));

                const {
                    fontFamily,
                    fontSize,
                    color,
                    backgroundColor,
                    bold,
                    italic,
                    underline,
                    strikethrough,
                    // verticalAlign,
                    linkHref,
                } = segment.format;

                if (fontFamily) {
                    span.style.fontFamily = fontFamily;
                }

                if (fontSize) {
                    span.style.fontSize = fontSize;
                }

                if (color) {
                    span.style.color = color;
                }

                if (backgroundColor) {
                    span.style.backgroundColor = backgroundColor;
                }

                if (linkHref) {
                    const a = wrap(span, 'A') as HTMLAnchorElement;
                    a.href = linkHref;
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

                if (strikethrough) {
                    // span.style.textDecoration += 'line-through ';
                    wrap(span, 'STRIKE');
                }

                // if (verticalAlign == VerticalAlign.Subscript) {
                //     wrap(span, 'SUB');
                // } else if (verticalAlign == VerticalAlign.Superscript) {
                //     wrap(span, 'SUP');
                // }

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
}
