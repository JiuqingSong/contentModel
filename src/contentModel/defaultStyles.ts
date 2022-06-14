import { ContentModel_BlockGroup, ContentModel_ParagraphFormat } from './types/Block';
import { ContentModel_SegmentFormat } from './types/Segment';

const FontSizes = ['10px', '13px', '16px', '18px', '24px', '32px', '48px'];

function getFontSize(size: string) {
    const intSize = parseInt(size);

    if (intSize === NaN) {
        return undefined;
    } else if (intSize < 1) {
        return FontSizes[0];
    } else if (intSize > FontSizes.length) {
        return FontSizes[FontSizes.length - 1];
    } else {
        return FontSizes[intSize - 1];
    }
}

export type DefaultFormatParserType =
    | Partial<CSSStyleDeclaration>
    | ((e: HTMLElement) => Partial<CSSStyleDeclaration>);

export const block: DefaultFormatParserType = {
    display: 'block',
};

export const inline: DefaultFormatParserType = {
    display: 'inline',
};

export const blockquote: DefaultFormatParserType = {
    ...block,
    marginTop: '1em',
    marginBottom: '1em',
    marginLeft: '40px',
    marginRight: '40px',
};

export const dl: DefaultFormatParserType = {
    ...block,
    marginTop: '1em',
    marginBottom: '1em',
};

export const dd: DefaultFormatParserType = {
    ...block,
    marginLeft: '40px',
    marginRight: '40px',
};

export const center: DefaultFormatParserType = {
    ...block,
    textAlign: 'center',
};

export const font: DefaultFormatParserType = e => {
    return {
        fontFamily: e.getAttribute('face') || undefined,
        fontSize: getFontSize(e.getAttribute('size')),
        color: e.getAttribute('color') || undefined,
    };
};

export const b: DefaultFormatParserType = {
    fontWeight: 'bold',
};

export const i: DefaultFormatParserType = {
    fontStyle: 'italic',
};

export const address: DefaultFormatParserType = {
    ...block,
    ...i,
};

export const li: DefaultFormatParserType = {
    display: 'list-item',
};

export const p: DefaultFormatParserType = {
    ...block,
    marginTop: '1em',
    marginBottom: '1em',
};

export const pre: DefaultFormatParserType = {
    ...block,
    whiteSpace: 'pre',
};

export const strike: DefaultFormatParserType = {
    textDecoration: 'line-through',
};

export const sub: DefaultFormatParserType = {
    verticalAlign: 'sub',
    fontSize: 'smaller',
};

export const sup: DefaultFormatParserType = {
    verticalAlign: 'super',
    fontSize: 'smaller',
};

export const u: DefaultFormatParserType = {
    textDecoration: 'underline',
};
