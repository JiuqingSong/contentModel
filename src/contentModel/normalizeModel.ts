import { ContentModel_Block, ContentModel_BlockGroup, ContentModel_BlockType } from './types/Block';
import { ContentModel_Segment, ContentModel_SegmentType } from './types/Segment';

export default function normalizeModel(group: ContentModel_BlockGroup) {
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
        // &&        !segment.alwaysKeep
    );
}

function isEmptyBlock(block: ContentModel_Block) {
    return block.blockType == ContentModel_BlockType.Paragraph && block.segments.length == 0;
}
