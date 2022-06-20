import { ContentModel_SegmentFormat } from '../../common/commonTypes';

export const enum ContentModel_SegmentType {
    Text,
    Image,
    Br,
    Entity,
}

export interface ContentModel_SegmentBase<T extends ContentModel_SegmentType> {
    type: T;
    format: ContentModel_SegmentFormat;
    isSelected: boolean;
    // alwaysKeep?: boolean;
}

export interface ContentModel_Text extends ContentModel_SegmentBase<ContentModel_SegmentType.Text> {
    text: string;
}

export interface ContentModel_Image
    extends ContentModel_SegmentBase<ContentModel_SegmentType.Image> {
    src: string;
    alterText?: string;
    // alwaysKeep: true;
}

export interface ContentModel_Br extends ContentModel_SegmentBase<ContentModel_SegmentType.Br> {}

export interface ContentModel_Entity
    extends ContentModel_SegmentBase<ContentModel_SegmentType.Entity> {}

export type ContentModel_Segment =
    | ContentModel_Text
    | ContentModel_Image
    | ContentModel_Entity
    | ContentModel_Br;
