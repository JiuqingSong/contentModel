import { ContentModel_Segment } from './types/Segment';
import {
    ContentModel_BlockGroup,
    ContentModel_BlockType,
    ContentModel_Document,
    ContentModel_Paragraph,
} from './types/Block';

export default function getSelectedSegments(model: ContentModel_Document) {
    const segments: ContentModel_Segment[] = [];

    traverse(model, paragraph => {
        paragraph.segments.forEach(segment => {
            if (segment.isSelected) {
                segments.push(segment);
            }
        });
    });

    return segments;
}

function traverse(
    group: ContentModel_BlockGroup,
    callback: (paragraph: ContentModel_Paragraph) => void
) {
    group.blocks.forEach(block => {
        switch (block.blockType) {
            case ContentModel_BlockType.BlockGroup:
                traverse(block, callback);
                break;

            case ContentModel_BlockType.List:
                block.listItems.forEach(item => traverse(item, callback));
                break;

            case ContentModel_BlockType.Table:
                block.cells.forEach(cells => {
                    cells.forEach(cell => traverse(cell, callback));
                });
                break;

            case ContentModel_BlockType.Paragraph:
                callback(block);
                break;
        }
    });
}
