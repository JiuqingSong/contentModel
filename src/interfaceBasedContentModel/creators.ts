import { FormatContext } from './elementProcessors';
import {
    ContentModel_BlockGroupType,
    ContentModel_BlockType,
    ContentModel_UnknownBlock,
    ContentModel_Paragraph,
    ContentModel_Table,
    ContentModel_TableCell,
} from './types/Block';
import {
    ContentModel_Br,
    ContentModel_Image,
    ContentModel_SegmentType,
    ContentModel_SelectionMarker,
    ContentModel_Text,
    ContentModel_UnknownSegment,
} from './types/Segment';

export function createSelectionMarker(context: FormatContext): ContentModel_SelectionMarker {
    return {
        segmentType: ContentModel_SegmentType.SelectionMarker,
        isSelected: true,
        format: context.segmentFormat,
    };
}

export function createBr(context: FormatContext): ContentModel_Br {
    return {
        segmentType: ContentModel_SegmentType.Br,
        format: {},
        isSelected: context.isInSelection,
    };
}

export function createImage(context: FormatContext, img: HTMLImageElement): ContentModel_Image {
    return {
        segmentType: ContentModel_SegmentType.Image,
        format: context.segmentFormat,
        src: img.src,
        isSelected: context.isInSelection,
    };
}

export function createText(context: FormatContext, text: string): ContentModel_Text {
    return {
        segmentType: ContentModel_SegmentType.Text,
        text: text,
        format: context.segmentFormat,
        isSelected: context.isInSelection,
    };
}

export function createTable(context: FormatContext, table: HTMLTableElement): ContentModel_Table {
    return {
        blockType: ContentModel_BlockType.Table,
        cells: Array.from(table.rows).map(_ => []),
    };
}

export function createTableCell(
    context: FormatContext,
    colSpan: number,
    rowSpan: number
): ContentModel_TableCell {
    return {
        blockGroupType: ContentModel_BlockGroupType.TableCell,
        blockType: ContentModel_BlockType.BlockGroup,
        blocks: [],
        // td: hasTd ? td : null,
        spanLeft: colSpan > 0,
        spanAbove: rowSpan > 0,
    };
}

export function createParagraph(context: FormatContext, isDummy: boolean): ContentModel_Paragraph {
    return {
        blockType: ContentModel_BlockType.Paragraph,
        segments: [],
        format: context.blockFormat,
        isDummy,
    };
}

export function createUnknownBlockAdapter(
    context: FormatContext,
    element: HTMLElement
): ContentModel_UnknownBlock {
    return {
        blockType: ContentModel_BlockType.BlockGroup,
        blockGroupType: ContentModel_BlockGroupType.UnknownBlock,
        node: element.cloneNode(),
        blocks: [],
    };
}

export function createUnknownSegmentAdapter(
    context: FormatContext,
    element: HTMLElement
): ContentModel_UnknownSegment {
    return {
        segmentType: ContentModel_SegmentType.UnknownSegment,
        isSelected: context.isInSelection,
        format: {},
        blocks: [],
        node: element.cloneNode(),
        blockType: ContentModel_BlockType.BlockGroup,
        blockGroupType: ContentModel_BlockGroupType.UnknownBlock,
    };
}
