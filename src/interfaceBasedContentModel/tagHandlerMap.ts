import {
    BlockDisplay,
    knownBlockProcessor,
    brProcessor,
    ElementProcessor,
    imageProcessor,
    knownSegmentProcessor,
    tableProcessor,
    TagHandler,
} from './elementProcessors';
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

function createTagHandler(style: DefaultFormatParserType, processor: ElementProcessor): TagHandler {
    return {
        style,
        processor,
    };
}

const generalProcessor: ElementProcessor = (group, context, element, defaultStyle) => {
    const processor =
        BlockDisplay.indexOf(element.style.display || defaultStyle.display) >= 0
            ? knownBlockProcessor
            : knownSegmentProcessor;

    processor(group, context, element, defaultStyle);
};

export const TagHandlerMap: Record<string, TagHandler> = {
    A: createTagHandler(inline, generalProcessor),
    ADDRESS: createTagHandler(address, generalProcessor),
    ARTICLE: createTagHandler(block, generalProcessor),
    ASIDE: createTagHandler(block, generalProcessor),
    B: createTagHandler(b, generalProcessor),
    BODY: createTagHandler(block, generalProcessor), // TODO
    BLOCKQUOTE: createTagHandler(blockquote, generalProcessor), // TODO
    BR: createTagHandler(block, brProcessor),
    CENTER: createTagHandler(center, generalProcessor),
    CODE: createTagHandler(inline, generalProcessor), // TODO
    DIV: createTagHandler(block, generalProcessor),
    DD: createTagHandler(dd, generalProcessor), // TODO
    DL: createTagHandler(dl, generalProcessor), // TODO
    DT: createTagHandler(block, generalProcessor), // TODO
    EM: createTagHandler(i, generalProcessor),
    FONT: createTagHandler(font, generalProcessor),
    FIELDSET: createTagHandler(block, generalProcessor), // TODO
    FIGURE: createTagHandler(block, generalProcessor), // TODO
    FIGCAPTION: createTagHandler(block, generalProcessor), // TODO
    FOOTER: createTagHandler(block, generalProcessor), // TODO
    FORM: createTagHandler(block, generalProcessor), // TODO
    I: createTagHandler(i, generalProcessor),
    IMG: createTagHandler(inline, imageProcessor),
    H1: createTagHandler(block, generalProcessor), // TODO
    H2: createTagHandler(block, generalProcessor), // TODO
    H3: createTagHandler(block, generalProcessor), // TODO
    H4: createTagHandler(block, generalProcessor), // TODO
    H5: createTagHandler(block, generalProcessor), // TODO
    H6: createTagHandler(block, generalProcessor), // TODO
    HEADER: createTagHandler(block, generalProcessor), // TODO
    HR: createTagHandler(block, generalProcessor), // TODO
    LI: createTagHandler(li, generalProcessor), // TODO
    MAIN: createTagHandler(block, generalProcessor), // TODO
    NAV: createTagHandler(block, generalProcessor), // TODO
    OL: createTagHandler(block, generalProcessor), // TODO
    P: createTagHandler(p, generalProcessor),
    PRE: createTagHandler(pre, generalProcessor),
    S: createTagHandler(strike, generalProcessor),
    SECTION: createTagHandler(block, generalProcessor),
    SPAN: createTagHandler(inline, generalProcessor),
    STRIKE: createTagHandler(strike, generalProcessor),
    STRONG: createTagHandler(b, generalProcessor),
    SUB: createTagHandler(sub, generalProcessor),
    SUP: createTagHandler(sup, generalProcessor),
    TABLE: createTagHandler(block, tableProcessor),
    TD: createTagHandler(block, generalProcessor), // TODO
    TBODY: createTagHandler(block, generalProcessor), // TODO
    TFOOT: createTagHandler(block, generalProcessor), // TODO
    TH: createTagHandler(block, generalProcessor), // TODO
    U: createTagHandler(u, generalProcessor),
    UL: createTagHandler(block, generalProcessor), // TODO
    VIDEO: createTagHandler(block, generalProcessor), // TODO
};
