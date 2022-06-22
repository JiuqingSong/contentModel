import { ContentModel_SegmentFormat } from '../../common/commonTypes';

export const enum ContentModel_SegmentType {
    Text,
    Image,
    Br,
    CollpasedSelection,
    Entity,
}

export interface ContentModel_SegmentBase<T extends ContentModel_SegmentType> {
    type: T;
    format: ContentModel_SegmentFormat;
    isSelected: boolean;
}

export interface ContentModel_CollapsedSelection
    extends ContentModel_SegmentBase<ContentModel_SegmentType.CollpasedSelection> {
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

export type ContentModel_Segment =
    | ContentModel_CollapsedSelection
    | ContentModel_Text
    | ContentModel_Image
    | ContentModel_Entity
    | ContentModel_Br;
