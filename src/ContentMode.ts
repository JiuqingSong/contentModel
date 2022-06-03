import { Alignment } from './roosterjs/Alignment';
import { Direction } from './roosterjs/Direction';

export const enum VerticalAlign {
    None,
    Superscript,
    Subscript,
}

export const enum SelectionType {
    Start,
    End,
}

export interface SegmentFormat {
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

export interface BlockFormat {
    align?: Alignment;
    direction?: Direction;
    indentation?: string;
}

export interface Segment {
    text: string;
    format: SegmentFormat;
    selection?: SelectionType;
}

export interface Block {
    segments: Segment[];
    format: BlockFormat;
}

export interface ContentModel {
    blocks: Block[];
}
