import { getTagOfNode } from 'roosterjs-editor-dom';

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

type DefaultFormatParserType =
    | Partial<CSSStyleDeclaration>
    | ((e: HTMLElement) => Partial<CSSStyleDeclaration>);

const font: DefaultFormatParserType = e => {
    return {
        fontFamily: e.getAttribute('face') || undefined,
        fontSize: getFontSize(e.getAttribute('size')),
        color: e.getAttribute('color') || undefined,
    };
};

const b: DefaultFormatParserType = {
    fontWeight: 'bold',
};

const i: DefaultFormatParserType = {
    fontStyle: 'italic',
};

const u: DefaultFormatParserType = {
    textDecoration: 'underline',
};

const p: DefaultFormatParserType = {
    marginTop: '1em',
    marginBottom: '1em',
};

const pre: DefaultFormatParserType = {
    whiteSpace: 'pre',
};

const strike: DefaultFormatParserType = {
    textDecoration: 'line-through',
};

const sub: DefaultFormatParserType = {
    verticalAlign: 'sub',
    fontSize: 'smaller',
};

const sup: DefaultFormatParserType = {
    verticalAlign: 'super',
    fontSize: 'smaller',
};

const TagDefaultFormat: Record<string, DefaultFormatParserType> = {
    B: b,
    EM: i,
    FONT: font,
    I: i,
    U: u,
    P: p,
    PRE: pre,
    S: strike,
    STRIKE: strike,
    STRONG: b,
    SUB: sub,
    SUP: sup,
};

export default function getElementDefaultStyle(e: HTMLElement): Partial<CSSStyleDeclaration> {
    const tag = getTagOfNode(e);
    const format = TagDefaultFormat[tag];

    if (typeof format === 'function') {
        return format(e);
    } else {
        return format || {};
    }
}
