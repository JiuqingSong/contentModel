import { SelectionPosition } from '../utils/normalizePosition';

export interface ContentModel_SegmentFormat {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    superscript?: boolean;
    subscript?: boolean;
    strikethrough?: boolean;

    fontFamily?: string;
    fontSize?: string;
    color?: string;
    backgroundColor?: string;

    linkHref?: string;
    linkTarget?: string;
}

export interface ContentModel_ParagraphFormat {
    direction?: 'ltr' | 'rtl';
    alignment?: 'left' | 'center' | 'right';
    indentation?: string;
    backgroundColor?: string;
    marginTop?: string;
    marginBottom?: string;
    marginLeft?: string;
    lineHeight?: string;
    whiteSpace?: string;
}

export interface SelectionContext {
    currentBlockNode: HTMLElement | null;
    currentSegmentNode: Node | null;
}

export interface SelectionInfo {
    start?: SelectionPosition;
    end?: SelectionPosition;
    context: SelectionContext;
}

const DummySegmentFormat: Required<ContentModel_SegmentFormat> = {
    bold: false,
    italic: false,
    underline: false,
    subscript: false,
    superscript: false,
    strikethrough: false,
    fontFamily: '',
    fontSize: '',
    color: '',
    backgroundColor: '',
    linkHref: '',
    linkTarget: '',
};

const SegmentFormatKeys = Object.keys(DummySegmentFormat) as (keyof ContentModel_SegmentFormat)[];

export function areSameFormats(f1: ContentModel_SegmentFormat, f2: ContentModel_SegmentFormat) {
    return SegmentFormatKeys.every(k => f1[k] === f2[k]);
}
