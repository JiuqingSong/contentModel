import { ContentModel_SegmentFormat } from '../../common/commonTypes';
import {
    ContentModel_Block,
    ContentModel_BlockGroup,
    ContentModel_BlockGroupBase,
    ContentModel_BlockGroupType,
    ContentModel_UnknownBlock,
} from './Block';

export const enum ContentModel_SegmentType {
    Text,
    Image,
    Br,
    SelectionMarker,
    UnknownSegment,
    Entity,
}

export interface ContentModel_SegmentBase<T extends ContentModel_SegmentType> {
    segmentType: T;
    format: ContentModel_SegmentFormat;
    isSelected: boolean;
}

export interface ContentModel_SelectionMarker
    extends ContentModel_SegmentBase<ContentModel_SegmentType.SelectionMarker> {
    isSelected: true;
}

export interface ContentModel_Text extends ContentModel_SegmentBase<ContentModel_SegmentType.Text> {
    text: string;
}

export interface ContentModel_Image
    extends ContentModel_SegmentBase<ContentModel_SegmentType.Image> {
    src: string;
    alterText?: string;
}

export interface ContentModel_Br extends ContentModel_SegmentBase<ContentModel_SegmentType.Br> {}

export interface ContentModel_Entity
    extends ContentModel_SegmentBase<ContentModel_SegmentType.Entity> {}

export interface ContentModel_UnknownSegment
    extends ContentModel_SegmentBase<ContentModel_SegmentType.UnknownSegment>,
        ContentModel_UnknownBlock {}

export type ContentModel_Segment =
    | ContentModel_SelectionMarker
    | ContentModel_Text
    | ContentModel_Image
    | ContentModel_Entity
    | ContentModel_Br
    | ContentModel_UnknownSegment;
