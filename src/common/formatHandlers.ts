import wrap from '../utils/wrap';
import { ContentModel_ParagraphFormat, ContentModel_SegmentFormat } from './commonTypes';

export interface FormatHandlerBase<
    TFormat extends ContentModel_ParagraphFormat | ContentModel_SegmentFormat
> {
    parse: (
        format: TFormat,
        element: HTMLElement,
        defaultStyle: Partial<CSSStyleDeclaration>
    ) => void;
    writeBack: (format: TFormat, element: HTMLElement) => void;
}

export type SegmentFormatHandler = FormatHandlerBase<ContentModel_SegmentFormat>;
export type ParagraphFormatHandler = FormatHandlerBase<ContentModel_ParagraphFormat>;
export type FormatHandler = FormatHandlerBase<
    ContentModel_ParagraphFormat | ContentModel_SegmentFormat
>;

const fontFamilyHandler: SegmentFormatHandler = {
    parse: (format, element, defaultStyle) => {
        const fontFamily = element.style.fontFamily || defaultStyle.fontFamily;

        if (fontFamily) {
            format.fontFamily = fontFamily;
        }
    },
    writeBack: (format, element) => {
        if (format.fontFamily) {
            element.style.fontFamily = format.fontFamily;
        }
    },
};

const fontSizeHandler: SegmentFormatHandler = {
    parse: (format, element, defaultStyle) => {
        const fontSize = element.style.fontSize || defaultStyle.fontSize;

        if (fontSize) {
            format.fontSize = fontSize;
        }
    },
    writeBack: (format, element) => {
        if (format.fontSize) {
            element.style.fontSize = format.fontSize;
        }
    },
};

const textColorHandler: SegmentFormatHandler = {
    parse: (format, element, defaultStyle) => {
        const textColor = element.style.color || defaultStyle.color;

        if (textColor) {
            format.color = textColor;
        }
    },
    writeBack: (format, element) => {
        if (format.color) {
            element.style.color = format.color;
        }
    },
};

const backColorHandler: FormatHandler = {
    parse: (format, element, defaultStyle) => {
        const backColor = element.style.backgroundColor || defaultStyle.backgroundColor;

        if (backColor) {
            format.backgroundColor = backColor;
        }
    },
    writeBack: (format, element) => {
        if (format.backgroundColor) {
            element.style.backgroundColor = format.backgroundColor;
        }
    },
};

const hyperLinkHandler: SegmentFormatHandler = {
    parse: (format, element, defaultStyle) => {
        if (element.tagName == 'A') {
            const href = element.getAttribute('href');
            const target = element.getAttribute('target');

            if (href) {
                format.linkHref = href;

                if (target) {
                    format.linkTarget = target;
                }
            }
        }
    },
    writeBack: (format, element) => {
        if (format.linkHref) {
            const a = wrap(element, 'A') as HTMLAnchorElement;
            a.href = format.linkHref;

            if (format.linkTarget) {
                a.target = format.linkTarget;
            }
        }
    },
};

const boldHandler: SegmentFormatHandler = {
    parse: (format, element, defaultStyle) => {
        const fontWeight = element.style.fontWeight || defaultStyle.fontWeight;

        if (fontWeight == 'bold' || fontWeight == 'bolder' || parseInt(fontWeight) >= 600) {
            format.bold = true;
        } else if (
            fontWeight == 'normal' ||
            fontWeight == 'lighter' ||
            fontWeight == 'initial' ||
            parseInt(fontWeight) < 600
        ) {
            format.bold = false;
        }
    },
    writeBack: (format, element) => {
        if (format.bold) {
            wrap(element, 'B');
        }
    },
};

const italicHandler: SegmentFormatHandler = {
    parse: (format, element, defaultStyle) => {
        const fontStyle = element.style.fontStyle || defaultStyle.fontStyle;

        if (fontStyle == 'italic' || fontStyle == 'oblique') {
            format.italic = true;
        } else if (fontStyle == 'initial' || fontStyle == 'normal') {
            format.italic = false;
        }
    },
    writeBack: (format, element) => {
        if (format.italic) {
            wrap(element, 'I');
        }
    },
};

const underlineHandler: SegmentFormatHandler = {
    parse: (format, element, defaultStyle) => {
        const textDecoration = element.style.textDecoration || defaultStyle.textDecoration;

        if (textDecoration?.indexOf('underline') >= 0) {
            format.underline = true;
        }
    },
    writeBack: (format, element) => {
        if (format.underline) {
            wrap(element, 'U');
        }
    },
};

const strikeHandler: SegmentFormatHandler = {
    parse: (format, element, defaultStyle) => {
        const textDecoration = element.style.textDecoration || defaultStyle.textDecoration;

        if (textDecoration?.indexOf('line-through') >= 0) {
            format.strikethrough = true;
        }
    },
    writeBack: (format, element) => {
        if (format.strikethrough) {
            wrap(element, 'STRIKE');
        }
    },
};

const superOrSubScriptHandler: SegmentFormatHandler = {
    parse: (format, element, defaultStyle) => {
        const verticalAlign = element.style.verticalAlign || defaultStyle.verticalAlign;

        if (verticalAlign == 'sub') {
            format.subscript = true;
            format.superscript = false;
        } else if (verticalAlign == 'super') {
            format.superscript = true;
            format.subscript = false;
        }
    },
    writeBack: (format, element) => {
        if (format.superscript) {
            wrap(element, 'SUP');
        }

        if (format.subscript) {
            wrap(element, 'SUB');
        }
    },
};

const directionHandler: ParagraphFormatHandler = {
    parse: (format, element, defaultStyle) => {
        const dir = element.style.direction || element.dir || defaultStyle.direction;

        if (dir) {
            format.direction = dir == 'rtl' ? 'rtl' : 'ltr';
        }
    },
    writeBack: (format, element) => {
        if (format.direction) {
            element.style.direction = format.direction;
        }
    },
};

const alignmentHandler: ParagraphFormatHandler = {
    parse: (format, element, defaultStyle) => {
        const align = element.style.textAlign || defaultStyle.textAlign;

        if (align) {
            format.alignment = align == 'right' ? 'right' : align == 'center' ? 'center' : 'right';
        }
    },
    writeBack: (format, element) => {
        if (format.alignment) {
            element.style.textAlign = format.alignment;
        }
    },
};

const marginHandler: ParagraphFormatHandler = {
    parse: (format, element, defaultStyle) => {
        const marginTop = element.style.marginTop || defaultStyle.marginTop;
        const marginBottom = element.style.marginBottom || defaultStyle.marginBottom;
        const marginLeft = element.style.marginLeft || defaultStyle.marginLeft;

        if (marginTop) {
            format.marginTop = marginTop;
        }
        if (marginBottom) {
            format.marginBottom = marginBottom;
        }
        if (marginLeft) {
            format.marginLeft = marginLeft; // TODO merge with parent margin
        }
    },
    writeBack: (format, element) => {
        if (format.marginTop) {
            element.style.marginTop = format.marginTop;
        }
        if (format.marginBottom) {
            element.style.marginBottom = format.marginBottom;
        }
        if (format.marginLeft) {
            element.style.marginLeft = format.marginLeft;
        }
    },
};

const indentationHandler: ParagraphFormatHandler = {
    parse: (format, element, defaultStyle) => {
        const indentation = element.style.textIndent || defaultStyle.textIndent;

        if (indentation) {
            format.indentation = indentation;
        }
    },
    writeBack: (format, element) => {
        if (format.indentation) {
            element.style.textIndent = format.indentation;
        }
    },
};

const lineHeightHandler: ParagraphFormatHandler = {
    parse: (format, element, defaultStyle) => {
        const lineHeight = element.style.lineHeight || defaultStyle.lineHeight;

        if (lineHeight) {
            format.lineHeight = lineHeight;
        }
    },
    writeBack: (format, element) => {
        if (format.lineHeight) {
            element.style.lineHeight = format.lineHeight;
        }
    },
};

const whiteSpaceHandler: ParagraphFormatHandler = {
    parse: (format, element, defaultStyle) => {
        const whiteSpace = element.style.whiteSpace || defaultStyle.whiteSpace;

        if (whiteSpace) {
            format.whiteSpace = whiteSpace;
        }
    },
    writeBack: (format, element) => {
        if (format.whiteSpace) {
            element.style.whiteSpace = format.whiteSpace;
        }
    },
};

// Order by frequency, from not common used to common used, for better optimization
export const SegmentFormatHandlers: SegmentFormatHandler[] = [
    superOrSubScriptHandler,
    strikeHandler,
    fontFamilyHandler,
    fontSizeHandler,
    underlineHandler,
    italicHandler,
    boldHandler,
    textColorHandler,
    backColorHandler,
    hyperLinkHandler,
];

export const ParagraphFormatHandlers: ParagraphFormatHandler[] = [
    backColorHandler,
    directionHandler,
    alignmentHandler,
    marginHandler,
    indentationHandler,
    lineHeightHandler,
    whiteSpaceHandler,
];
