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
    const result: ContentModel_Br = {
        segmentType: ContentModel_SegmentType.Br,
        format: {},
    };

    if (context.isInSelection) {
        result.isSelected = true;
    }

    return result;
}

export function createImage(context: FormatContext, img: HTMLImageElement): ContentModel_Image {
    const result: ContentModel_Image = {
        segmentType: ContentModel_SegmentType.Image,
        format: context.segmentFormat,
        src: img.src,
    };

    if (context.isInSelection) {
        result.isSelected = true;
    }

    return result;
}

export function createText(context: FormatContext, text: string): ContentModel_Text {
    const result: ContentModel_Text = {
        segmentType: ContentModel_SegmentType.Text,
        text: text,
        format: context.segmentFormat,
    };

    if (context.isInSelection) {
        result.isSelected = true;
    }

    return result;
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
    rowSpan: number,
    isHeader: boolean
): ContentModel_TableCell {
    return {
        blockGroupType: ContentModel_BlockGroupType.TableCell,
        blockType: ContentModel_BlockType.BlockGroup,
        blocks: [],
        // td: hasTd ? td : null,
        spanLeft: colSpan > 0,
        spanAbove: rowSpan > 0,
        isHeader,
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
    const result: ContentModel_UnknownSegment = {
        segmentType: ContentModel_SegmentType.UnknownSegment,
        format: {},
        blocks: [],
        node: element.cloneNode(),
        blockType: ContentModel_BlockType.BlockGroup,
        blockGroupType: ContentModel_BlockGroupType.UnknownBlock,
    };

    if (context.isInSelection) {
        result.isSelected = true;
    }

    return result;
}
