import { ContentModel_ParagraphFormat } from './types/Block';
import { ContentModel_SegmentFormat } from './types/Segment';
import { safeInstanceOf } from 'roosterjs';

export type FormatHandlerBase<
    Format extends ContentModel_ParagraphFormat | ContentModel_SegmentFormat
> = (format: Format, element: HTMLElement, defaultStyle: Partial<CSSStyleDeclaration>) => void;

export type SegmentFormatHandler = FormatHandlerBase<ContentModel_SegmentFormat>;
export type ParagraphFormatHandler = FormatHandlerBase<ContentModel_ParagraphFormat>;
export type FormatHandler = FormatHandlerBase<
    ContentModel_SegmentFormat | ContentModel_ParagraphFormat
>;

const fontFamilyHandler: SegmentFormatHandler = (format, element, defaultStyle) => {
    const fontFamily = element.style.fontFamily || defaultStyle.fontFamily;

    if (fontFamily) {
        format.fontFamily = fontFamily;
    }
};

const fontSizeHandler: SegmentFormatHandler = (format, element, defaultStyle) => {
    const fontSize = element.style.fontSize || defaultStyle.fontSize;

    if (fontSize) {
        format.fontSize = fontSize;
    }
};

const textColorHandler: SegmentFormatHandler = (format, element, defaultStyle) => {
    const textColor = element.style.color || defaultStyle.color;

    if (textColor) {
        format.color = textColor;
    }
};

const backColorHandler: FormatHandler = (format, element, defaultStyle) => {
    const backColor = element.style.backgroundColor || defaultStyle.backgroundColor;

    if (backColor) {
        format.backgroundColor = backColor;
    }
};

const hyperLinkHandler: SegmentFormatHandler = (format, element, defaultStyle) => {
    if (safeInstanceOf(element, 'HTMLAnchorElement')) {
        const href = element.getAttribute('href');
        const target = element.target;

        if (href) {
            format.linkHref = href;

            if (target) {
                format.linkTarget = target;
            }
        }
    }
};

const boldHandler: SegmentFormatHandler = (format, element, defaultStyle) => {
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
};

const italicHandler: SegmentFormatHandler = (format, element, defaultStyle) => {
    const fontStyle = element.style.fontStyle || defaultStyle.fontStyle;

    if (fontStyle == 'italic' || fontStyle == 'oblique') {
        format.italic = true;
    } else if (fontStyle == 'initial' || fontStyle == 'normal') {
        format.italic = false;
    }
};

const underlineHandler: SegmentFormatHandler = (format, element, defaultStyle) => {
    const textDecoration = element.style.textDecoration || defaultStyle.textDecoration;

    if (textDecoration?.indexOf('underline') >= 0) {
        format.underline = true;
    }
};

const strikeHandler: SegmentFormatHandler = (format, element, defaultStyle) => {
    const textDecoration = element.style.textDecoration || defaultStyle.textDecoration;

    if (textDecoration?.indexOf('line-through') >= 0) {
        format.strikethrough = true;
    }
};

const superOrSubScriptHandler: SegmentFormatHandler = (format, element, defaultStyle) => {
    const verticalAlign = element.style.verticalAlign || defaultStyle.verticalAlign;

    if (verticalAlign == 'sub') {
        format.subscript = true;
        format.superscript = false;
    } else if (verticalAlign == 'super') {
        format.superscript = true;
        format.subscript = false;
    }
};

const directionHandler: ParagraphFormatHandler = (format, element, defaultStyle) => {
    const dir = element.style.direction || element.dir || defaultStyle.direction;

    if (dir) {
        format.direction = dir == 'rtl' ? 'rtl' : 'ltr';
    }
};

const alignmentHandler: ParagraphFormatHandler = (format, element, defaultStyle) => {
    const align = element.style.textAlign || defaultStyle.textAlign;

    if (align) {
        format.alignment = align == 'right' ? 'right' : align == 'center' ? 'center' : 'right';
    }
};

const marginHandler: ParagraphFormatHandler = (format, element, defaultStyle) => {
    const marginTop = element.style.marginTop || defaultStyle.marginTop;
    const marginBottom = element.style.marginBottom || defaultStyle.marginBottom;

    if (marginTop) {
        format.marginTop = marginTop;
    }
    if (marginBottom) {
        format.marginTop = marginBottom;
    }
};

const indentationHandler: ParagraphFormatHandler = (format, element, defaultStyle) => {
    const indentation = element.style.textIndent || defaultStyle.textIndent;

    if (indentation) {
        format.indentation = indentation;
    }
};

const lineHeightHandler: ParagraphFormatHandler = (format, element, defaultStyle) => {
    const lineHeight = element.style.lineHeight || defaultStyle.lineHeight;

    if (lineHeight) {
        format.lineHeight = lineHeight;
    }
};

const whiteSpaceHandler: ParagraphFormatHandler = (format, element, defaultStyle) => {
    const whiteSpace = element.style.whiteSpace || defaultStyle.whiteSpace;

    if (whiteSpace) {
        format.whiteSpace = whiteSpace;
    }
};

export const SegmentFormatHandlers: SegmentFormatHandler[] = [
    fontFamilyHandler,
    fontSizeHandler,
    textColorHandler,
    backColorHandler,
    hyperLinkHandler,
    boldHandler,
    italicHandler,
    underlineHandler,
    strikeHandler,
    superOrSubScriptHandler,
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
