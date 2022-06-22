import { containerProcessor, FormatContext } from './elementProcessors';
import { ContentModel_Segment, ContentModel_SegmentType } from './types/Segment';
import { TagHandlerMap } from './tagHandlerMap';
import {
    ContentModel_Block,
    ContentModel_BlockGroupType,
    ContentModel_BlockType,
    ContentModel_Document,
    ContentModel_BlockGroup,
} from './types/Block';

export default function createContentModel(root: Node, range: Range | null): ContentModel_Document {
    const context = createFormatContext(range);
    const model = createEmptyModel();

    containerProcessor(model, root, context);
    normalizeModel(model);

    return model;
}

function createEmptyModel(): ContentModel_Document {
    return {
        blockGroupType: ContentModel_BlockGroupType.Document,
        blockType: ContentModel_BlockType.BlockGroup,
        blocks: [],
    };
}

function createFormatContext(range: Range | null): FormatContext {
    const context: FormatContext = {
        tagHandlers: TagHandlerMap,
        blockFormat: {},
        segmentFormat: {},
        isInSelection: false,
    };

    if (range) {
        context.startContainer = range.startContainer;
        context.startOffset = range.startOffset;
        context.endContainer = range.endContainer;
        context.endOffset = range.endOffset;
    }

    return context;
}

function normalizeModel(group: ContentModel_BlockGroup) {
    for (let i = group.blocks.length - 1; i >= 0; i--) {
        const block = group.blocks[i];

        switch (block.blockType) {
            case ContentModel_BlockType.BlockGroup:
                normalizeModel(block);
                break;
            case ContentModel_BlockType.List:
                for (let j = 0; j < block.listItems.length; j++) {
                    normalizeModel(block.listItems[j]);
                }
                break;
            case ContentModel_BlockType.Paragraph:
                for (let j = block.segments.length - 1; j >= 0; j--) {
                    if (isEmptySegment(block.segments[j])) {
                        block.segments.splice(j, 1);
                    }
                }
                break;
            case ContentModel_BlockType.Table:
                for (let r = 0; r < block.cells.length; r++) {
                    for (let c = 0; c < block.cells[r].length; c++) {
                        normalizeModel(block.cells[r][c]);
                    }
                }
                break;
        }

        if (isEmptyBlock(block)) {
            group.blocks.splice(i, 1);
        }
    }
}

function isEmptySegment(segment: ContentModel_Segment) {
    return (
        segment.type == ContentModel_SegmentType.Text &&
        (!segment.text || /^[\r\n]*$/.test(segment.text))
    );
}

function isEmptyBlock(block: ContentModel_Block) {
    return block.blockType == ContentModel_BlockType.Paragraph && block.segments.length == 0;
}
