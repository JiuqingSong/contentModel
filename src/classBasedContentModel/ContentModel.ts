import { arrayPush, toArray } from 'roosterjs';
import { ParagraphFormatHandlers, SegmentFormatHandlers } from '../common/formatHandlers';
import {
    areSameFormats,
    ContentModel_ParagraphFormat,
    ContentModel_SegmentFormat,
    SelectionContext,
} from '../common/commonTypes';
import {
    address,
    b,
    block,
    blockquote,
    center,
    dl,
    dd,
    i,
    inline,
    font,
    li,
    p,
    pre,
    strike,
    sub,
    sup,
    u,
    DefaultFormatParserType,
} from '../common/defaultStyles';

export type ElementProcessor = (
    group: ContentModel_BlockGroup,
    context: FormatContext,
    element: HTMLElement,
    defaultStyle: Partial<CSSStyleDeclaration>
) => void;

export interface TagHandler {
    style: DefaultFormatParserType;
    processor: ElementProcessor;
}

export interface FormatContext {
    tagHandlers: Record<string, TagHandler>;

    blockFormat: ContentModel_ParagraphFormat;
    segmentFormat: ContentModel_SegmentFormat;
    isInSelection: boolean;

    startContainer?: Node;
    endContainer?: Node;
    startOffset?: number;
    endOffset?: number;
}

export abstract class ContentModel_Block {
    public abstract normalize(): void;
    public abstract toDOM(doc: Document, parent: Node, context: SelectionContext): void;
    public abstract traverse(callback: (paragraph: ContentModel_Paragraph) => void): void;

    public isEmpty() {
        return false;
    }
}

export class ContentModel_List extends ContentModel_Block {
    private listItems: ContentModel_ListITem[];

    public normalize(): void {
        for (let j = 0; j < this.listItems.length; j++) {
            this.listItems[j].normalize();
        }
    }

    public toDOM(doc: Document, parent: Node, context: SelectionContext): void {}

    public traverse(callback: (paragraph: ContentModel_Paragraph) => void): void {
        this.listItems.forEach(item => item.traverse(callback));
    }
}

export class ContentModel_Table extends ContentModel_Block {
    private cells: ContentModel_TableCell[][];

    constructor(tableElement: HTMLTableElement) {
        super();
        this.cells = toArray(tableElement.rows).map(_ => []);
    }

    public static processor: ElementProcessor = (group, context, element) => {
        const tableElement = element as HTMLTableElement;
        const table = new ContentModel_Table(tableElement);

        group.addBlock(table);

        for (let row = 0; row < tableElement.rows.length; row++) {
            const tr = tableElement.rows[row];
            for (let sourceCol = 0, targetCol = 0; sourceCol < tr.cells.length; sourceCol++) {
                for (; table.cells[row][targetCol]; targetCol++) {}

                const td = tr.cells[sourceCol];

                for (let colSpan = 0; colSpan < td.colSpan; colSpan++, targetCol++) {
                    for (let rowSpan = 0; rowSpan < td.rowSpan; rowSpan++) {
                        const hasTd = colSpan + rowSpan == 0;
                        const cell = new ContentModel_TableCell(colSpan > 0, rowSpan > 0);

                        table.cells[row + rowSpan][targetCol] = cell;

                        if (hasTd) {
                            cell.create(td, context);
                        }
                    }
                }
            }
        }
    };

    public normalize(): void {
        for (let r = 0; r < this.cells.length; r++) {
            for (let c = 0; c < this.cells[r].length; c++) {
                this.cells[r][c].normalize();
            }
        }
    }

    public toDOM(doc: Document, parent: Node, context: SelectionContext): void {
        const tableNode = doc.createElement('table');
        parent.appendChild(tableNode);

        for (let row = 0; row < this.cells.length; row++) {
            const tr = doc.createElement('tr');
            tableNode.appendChild(tr);

            for (let col = 0; col < this.cells[row].length; col++) {
                const cell = this.cells[row][col];

                if (!cell.isSpanAbove() && !cell.isSpanLeft()) {
                    const td = doc.createElement('td');
                    tr.appendChild(td);

                    let rowSpan = 1;
                    let colSpan = 1;

                    for (; this.cells[row + rowSpan]?.[col]?.isSpanAbove(); rowSpan++) {}
                    for (; this.cells[row][col + colSpan]?.isSpanLeft(); colSpan++) {}

                    if (rowSpan > 1) {
                        td.rowSpan = rowSpan;
                    }

                    if (colSpan > 1) {
                        td.colSpan = colSpan;
                    }

                    cell.toDOM(doc, td, context);
                }
            }
        }
    }

    public traverse(callback: (paragraph: ContentModel_Paragraph) => void): void {
        this.cells.forEach(cells => {
            cells.forEach(cell => cell.traverse(callback));
        });
    }
}

export class ContentModel_Paragraph extends ContentModel_Block {
    private segments: ContentModel_Segment[];

    constructor(private format: ContentModel_ParagraphFormat) {
        super();
        this.segments = [];
    }

    public normalize(): void {
        for (let j = this.segments.length - 1; j >= 0; j--) {
            if (this.segments[j].isEmpty()) {
                this.segments.splice(j, 1);
            }
        }
    }

    public toDOM(doc: Document, parent: Node, context: SelectionContext): void {
        const div = doc.createElement('div');
        parent.appendChild(div);

        ParagraphFormatHandlers.forEach(handler => handler.writeBack(this.format, div));

        let previousSegment: ContentModel_Segment | null = null;
        let previousSpan: HTMLElement | null = null;

        this.segments.forEach(segment => {
            let pendingStartContainer = false;

            if (segment.isSegmentSelected() && !context.isInSelection) {
                context.isInSelection = true;
                context.startOffset = previousSpan?.textContent.length || 0;
                context.startContainer = previousSpan;
                pendingStartContainer = true;
            } else if (!segment.isSegmentSelected() && context.isInSelection) {
                context.isInSelection = false;
                context.endContainer = context.lastElement;
                context.endOffset = context.lastElement?.textContent.length || 0;
            }

            const newSpan = segment.toDOM(doc, div, previousSegment, previousSpan);

            previousSegment = segment;

            if (pendingStartContainer) {
                if (context.startContainer != newSpan) {
                    context.startOffset = 0;
                }

                context.startContainer = newSpan;
            }

            if (context.isInSelection) {
                context.lastElement = newSpan;
            }

            previousSpan = newSpan;
        });
    }

    public isEmpty(): boolean {
        return this.segments.length == 0;
    }

    public addSegment(segment: ContentModel_Segment) {
        this.segments.push(segment);
    }

    public addTextSegment(context: FormatContext): ContentModel_Text {
        const segmentFormat = { ...context.segmentFormat };
        const newSegment = new ContentModel_Text(segmentFormat, context.isInSelection, '');

        this.addSegment(newSegment);

        return newSegment;
    }

    public getOrAddTextSegment(context: FormatContext): ContentModel_Text {
        const lastSegment = this.segments[this.segments.length - 1];
        return lastSegment instanceof ContentModel_Text
            ? lastSegment
            : this.addTextSegment(context);
    }

    public textProcessor(text: string, context: FormatContext) {
        const textSegment = this.getOrAddTextSegment(context);
        textSegment.addText(text);

        // return lastBlock;

        // if (!/^[\r\n]*$/.test(nodeValue)) {
        // } else if (lastSegment.text) {
        //     lastSegment.text += ' ';
        // }
    }

    public traverse(callback: (paragraph: ContentModel_Paragraph) => void): void {
        callback(this);
    }

    public getSelectedSegments(): ContentModel_Segment[] {
        return this.segments.filter(s => s.isSegmentSelected());
    }
}

const BlockDisplay = ['block', 'flex', 'grid', 'list-item'];

export class ContentModel_BlockGroup extends ContentModel_Block {
    protected blocks: ContentModel_Block[];

    constructor() {
        super();
        this.blocks = [];
    }

    public static processor: ElementProcessor = (group, context, element, defaultStyle) => {
        const processor =
            BlockDisplay.indexOf(element.style.display || defaultStyle.display!) >= 0
                ? ContentModel_BlockGroup.blockProcessor
                : ContentModel_BlockGroup.segmentProcessor;

        processor(group, context, element, defaultStyle);
    };

    private static blockProcessor: ElementProcessor = (group, context, element, defaultStyle) => {
        const originalBlockFormat = context.blockFormat;
        const originalSegmentFormat = context.segmentFormat;

        context.blockFormat = {
            ...originalBlockFormat,
        };
        context.segmentFormat = { ...originalSegmentFormat };

        ParagraphFormatHandlers.forEach(handler =>
            handler.parse(context.blockFormat, element, defaultStyle)
        );
        SegmentFormatHandlers.forEach(handler =>
            handler.parse(context.segmentFormat, element, defaultStyle)
        );

        group.addParagraph(context);
        group.create(element, context);

        context.blockFormat = originalBlockFormat;
        context.segmentFormat = originalSegmentFormat;

        group.addParagraph(context);
    };

    private static segmentProcessor: ElementProcessor = (group, context, element, defaultStyle) => {
        const originalSegmentFormat = context.segmentFormat;

        context.segmentFormat = { ...originalSegmentFormat };
        SegmentFormatHandlers.forEach(handler =>
            handler.parse(context.segmentFormat, element, defaultStyle)
        );

        let paragraph = group.getOrAddParagraph(context);
        paragraph.addTextSegment(context);
        group.create(element, context);

        paragraph = group.getOrAddParagraph(context);
        context.segmentFormat = originalSegmentFormat;
        paragraph.addTextSegment(context);
    };

    public getOrAddParagraph(context: FormatContext) {
        const lastBlock = this.blocks[this.blocks.length - 1];

        return lastBlock instanceof ContentModel_Paragraph ? lastBlock : this.addParagraph(context);
    }

    public addBlock(block: ContentModel_Block) {
        this.blocks.push(block);
    }

    private addParagraph(context: FormatContext): ContentModel_Paragraph {
        const blockFormat = {
            ...context.blockFormat,
        };
        const paragraph = new ContentModel_Paragraph(blockFormat);

        this.addBlock(paragraph);

        return paragraph;
    }

    public create(parent: Node, context: FormatContext) {
        const paragraph = this.getOrAddParagraph(context);

        let startOffset = context.startContainer == parent ? context.startOffset : -1;
        let endOffset = context.endContainer == parent ? context.endOffset : -1;
        let index = 0;

        for (let child = parent.firstChild; child; child = child.nextSibling) {
            if (index == startOffset) {
                context.isInSelection = true;
                paragraph.addTextSegment(context);
            }

            if (index == endOffset) {
                paragraph.addTextSegment(context);
                context.isInSelection = false;
                paragraph.addTextSegment(context);
            }

            switch (child.nodeType) {
                case Node.ELEMENT_NODE:
                    const element = child as HTMLElement;
                    const handler = context.tagHandlers[element.tagName];
                    const processor = handler?.processor || ContentModel_BlockGroup.processor;
                    const format = handler
                        ? typeof handler.style === 'function'
                            ? handler.style(element)
                            : handler.style
                        : {};

                    processor(this, context, element, format || {});

                    break;

                case Node.TEXT_NODE:
                    const textNode = child as Text;
                    const paragraph = this.getOrAddParagraph(context);

                    let txt = textNode.nodeValue!;
                    startOffset = context.startContainer == textNode ? context.startOffset : -1;
                    endOffset = context.endContainer == textNode ? context.endOffset : -1;

                    if (startOffset! >= 0) {
                        paragraph.textProcessor(txt.substring(0, startOffset), context);
                        context.isInSelection = true;

                        paragraph.addTextSegment(context);

                        txt = txt.substring(startOffset!);
                        endOffset! -= startOffset!;
                    }

                    if (endOffset! >= 0) {
                        paragraph.addTextSegment(context);

                        paragraph.textProcessor(txt.substring(0, endOffset), context);
                        context.isInSelection = false;

                        paragraph.addTextSegment(context);
                        txt = txt.substring(endOffset!);
                    }

                    paragraph.textProcessor(txt, context);
                    break;
            }

            index++;
        }
    }

    public normalize() {
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            const block = this.blocks[i];

            block.normalize();

            if (block.isEmpty()) {
                this.blocks.splice(i, 1);
            }
        }
    }

    public toDOM(doc: Document, parent: Node, context: SelectionContext): void {
        let newParent = parent;

        this.blocks.forEach(childBlock => childBlock.toDOM(doc, newParent, context));
    }

    public traverse(callback: (paragraph: ContentModel_Paragraph) => void) {
        this.blocks.forEach(block => {
            block.traverse(callback);
        });
    }
}

export class ContentModel_Document extends ContentModel_BlockGroup {
    private document: Document;

    constructor(parent: Node, range: Range | null) {
        super();

        this.document = parent.ownerDocument!;
        const context = createFormatContext(range);

        this.create(parent, context);
        this.normalize();
    }

    public createFragment(): [DocumentFragment, SelectionContext] {
        const fragment = this.document.createDocumentFragment();
        const context: SelectionContext = {
            isInSelection: false,
            lastElement: null,
            // previousSelectionAnchor: null,
        };

        this.toDOM(this.document, fragment, context);

        if (context.startContainer && !context.endContainer) {
            // if (context.previousSelectionAnchor) {
            //     context.endContainer = context.previousSelectionAnchor;
            //     context.endOffset = context.endContainer.textContent.length;
            // } else {
            //     context.startContainer = undefined;
            //     context.startOffset = undefined;
            // }
            // context.previousSelectionAnchor = null;
        }

        return [fragment, context];
    }

    public getSelectedSegments(): ContentModel_Segment[] {
        const segments: ContentModel_Segment[] = [];

        this.traverse(paragraph => {
            arrayPush(segments, paragraph.getSelectedSegments());
        });

        return segments;
    }
}

export class ContentModel_Quote extends ContentModel_BlockGroup {}

export class ContentModel_Header extends ContentModel_BlockGroup {}

export class ContentModel_ListITem extends ContentModel_BlockGroup {}

export class ContentModel_TableCell extends ContentModel_BlockGroup {
    constructor(private spanLeft: boolean, private spanAbove: boolean) {
        super();
    }

    public isSpanLeft() {
        return this.spanLeft;
    }

    public isSpanAbove() {
        return this.spanAbove;
    }
}

export abstract class ContentModel_Segment {
    constructor(
        public readonly format: ContentModel_SegmentFormat,
        protected isSelected: boolean
    ) {}

    public isEmpty() {
        return false;
    }

    public isSegmentSelected() {
        return this.isSelected;
    }

    protected abstract createDOMElement(doc: Document): HTMLElement;

    public toDOM(
        doc: Document,
        parent: Node,
        previousSegment: ContentModel_Segment | null,
        previousSpan: HTMLSpanElement | null
    ) {
        const element = this.createDOMElement(doc);

        if (element) {
            parent.appendChild(element);

            SegmentFormatHandlers.forEach(handler => {
                handler.writeBack(this.format, element);
            });
        }

        return element;
    }
}

export class ContentModel_Text extends ContentModel_Segment {
    constructor(format: ContentModel_SegmentFormat, isSelected: boolean, private text: string) {
        super(format, isSelected);
    }

    public addText(additionalText: string) {
        this.text += additionalText;
    }

    public isEmpty() {
        return !this.text || /^[\r\n]*$/.test(this.text);
    }

    protected createDOMElement(doc: Document): HTMLElement {
        const element = doc.createElement('span');
        element.appendChild(doc.createTextNode(this.text));

        return element;
    }

    public toDOM(
        doc: Document,
        parent: Node,
        previousSegment: ContentModel_Segment | null,
        previousSpan: HTMLSpanElement | null
    ) {
        if (
            previousSegment &&
            previousSpan &&
            previousSegment instanceof ContentModel_Text &&
            areSameFormats(this.format, previousSegment.format)
        ) {
            previousSpan.textContent += this.text;
            return previousSpan;
        } else {
            super.toDOM(doc, parent, previousSegment, previousSpan);
        }
    }
}

export class ContentModel_Image extends ContentModel_Segment {
    private alterText?: string;

    constructor(format: ContentModel_SegmentFormat, isSelected: boolean, private src: string) {
        super(format, isSelected);
    }

    protected createDOMElement(doc: Document): HTMLElement {
        const element = doc.createElement('img');
        element.setAttribute('src', this.src);

        return element;
    }

    public static processor: ElementProcessor = (group, context, element, defaultStyle) => {
        const imageElement = element as HTMLImageElement;
        const segmentFormat = { ...context.segmentFormat };

        SegmentFormatHandlers.forEach(handler =>
            handler.parse(segmentFormat, imageElement, defaultStyle)
        );

        const image = new ContentModel_Image(
            segmentFormat,
            context.isInSelection,
            imageElement.src
        );
        const paragraph = group.getOrAddParagraph(context);
        paragraph.addSegment(image);
    };
}

export class ContentModel_Br extends ContentModel_Segment {
    constructor(isSelected: boolean) {
        super({}, isSelected);
    }

    protected createDOMElement(doc: Document): HTMLElement {
        return doc.createElement('br');
    }

    public static processor: ElementProcessor = (group, context) => {
        const paragraph = group.getOrAddParagraph(context);
        paragraph.addSegment(new ContentModel_Br(context.isInSelection));
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

function createTagHandler(style: DefaultFormatParserType, processor: ElementProcessor): TagHandler {
    return {
        style,
        processor,
    };
}

export const TagHandlerMap: Record<string, TagHandler> = {
    A: createTagHandler(inline, ContentModel_BlockGroup.processor),
    ADDRESS: createTagHandler(address, ContentModel_BlockGroup.processor),
    ARTICLE: createTagHandler(block, ContentModel_BlockGroup.processor),
    ASIDE: createTagHandler(block, ContentModel_BlockGroup.processor),
    B: createTagHandler(b, ContentModel_BlockGroup.processor),
    BODY: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    BLOCKQUOTE: createTagHandler(blockquote, ContentModel_BlockGroup.processor), // TODO
    BR: createTagHandler(block, ContentModel_Br.processor),
    CENTER: createTagHandler(center, ContentModel_BlockGroup.processor),
    CODE: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    DIV: createTagHandler(block, ContentModel_BlockGroup.processor),
    DD: createTagHandler(dd, ContentModel_BlockGroup.processor), // TODO
    DL: createTagHandler(dl, ContentModel_BlockGroup.processor), // TODO
    DT: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    EM: createTagHandler(i, ContentModel_BlockGroup.processor),
    FONT: createTagHandler(font, ContentModel_BlockGroup.processor),
    FIELDSET: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    FIGURE: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    FIGCAPTION: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    FOOTER: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    FORM: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    I: createTagHandler(i, ContentModel_BlockGroup.processor),
    IMG: createTagHandler(inline, ContentModel_Image.processor),
    H1: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    H2: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    H3: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    H4: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    H5: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    H6: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    HEADER: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    HR: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    LI: createTagHandler(li, ContentModel_BlockGroup.processor), // TODO
    MAIN: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    NAV: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    OL: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    P: createTagHandler(p, ContentModel_BlockGroup.processor),
    PRE: createTagHandler(pre, ContentModel_BlockGroup.processor),
    S: createTagHandler(strike, ContentModel_BlockGroup.processor),
    SECTION: createTagHandler(block, ContentModel_BlockGroup.processor),
    SPAN: createTagHandler(inline, ContentModel_BlockGroup.processor),
    STRIKE: createTagHandler(strike, ContentModel_BlockGroup.processor),
    STRONG: createTagHandler(b, ContentModel_BlockGroup.processor),
    SUB: createTagHandler(sub, ContentModel_BlockGroup.processor),
    SUP: createTagHandler(sup, ContentModel_BlockGroup.processor),
    TABLE: createTagHandler(block, ContentModel_Table.processor),
    TD: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    TBODY: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    TFOOT: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    TH: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    U: createTagHandler(u, ContentModel_BlockGroup.processor),
    UL: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
    VIDEO: createTagHandler(block, ContentModel_BlockGroup.processor), // TODO
};
