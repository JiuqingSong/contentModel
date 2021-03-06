import { ContentModel_ParagraphFormat } from '../../common/commonTypes';
import { ContentModel_Segment } from './Segment';

export const enum ContentModel_BlockType {
    BlockGroup,
    List,
    Table,
    Paragraph,
}

export const enum ContentModel_BlockGroupType {
    Document,
    Quote,
    Code,
    Header,
    ListItem,
    TableCell,
    Entity,
    UnknownBlock,
}

export interface ContentModel_BlockBase<T extends ContentModel_BlockType> {
    blockType: T;
}

export interface ContentModel_List extends ContentModel_BlockBase<ContentModel_BlockType.List> {
    listItems: ContentModel_ListItem[];
}

export interface ContentModel_Table extends ContentModel_BlockBase<ContentModel_BlockType.Table> {
    cells: ContentModel_TableCell[][];
}

export interface ContentModel_Paragraph
    extends ContentModel_BlockBase<ContentModel_BlockType.Paragraph> {
    format: ContentModel_ParagraphFormat;
    segments: ContentModel_Segment[];
    isDummy: boolean;
}

export interface ContentModel_BlockGroupBase<T extends ContentModel_BlockGroupType>
    extends ContentModel_BlockBase<ContentModel_BlockType.BlockGroup> {
    blockGroupType: T;
    blocks: ContentModel_Block[];
}

export interface ContentModel_Document
    extends ContentModel_BlockGroupBase<ContentModel_BlockGroupType.Document> {}

export interface ContentModel_Quote
    extends ContentModel_BlockGroupBase<ContentModel_BlockGroupType.Quote> {}

export interface ContentModel_Code
    extends ContentModel_BlockGroupBase<ContentModel_BlockGroupType.Code> {}

export interface ContentModel_Header
    extends ContentModel_BlockGroupBase<ContentModel_BlockGroupType.Header> {
    headerLevel: number;
}

export interface ContentModel_ListItem
    extends ContentModel_BlockGroupBase<ContentModel_BlockGroupType.ListItem> {
    listTypes: ('ordered' | 'unordered')[];
}

export interface ContentModel_TableCell
    extends ContentModel_BlockGroupBase<ContentModel_BlockGroupType.TableCell> {
    spanLeft: boolean;
    spanAbove: boolean;
    isHeader?: boolean;
}

export interface ContentModel_Entity
    extends ContentModel_BlockGroupBase<ContentModel_BlockGroupType.Entity> {}

export interface ContentModel_UnknownBlock
    extends ContentModel_BlockGroupBase<ContentModel_BlockGroupType.UnknownBlock> {
    node: Node;
}

export type ContentModel_BlockGroup =
    | ContentModel_Document
    | ContentModel_Quote
    | ContentModel_Code
    | ContentModel_Header
    | ContentModel_ListItem
    | ContentModel_TableCell
    | ContentModel_Entity
    | ContentModel_UnknownBlock;

export type ContentModel_Block =
    | ContentModel_BlockGroup
    | ContentModel_List
    | ContentModel_Table
    | ContentModel_Paragraph;
