import {
    brProcessor,
    ElementProcessor,
    generalProcessor,
    imageProcessor,
    tableProcessor,
    TagHandler,
} from './elementProcessors';
import {
    b,
    block,
    blockquote,
    center,
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
} from './defaultStyles';

function createTagHandler(style: DefaultFormatParserType, processor: ElementProcessor): TagHandler {
    return {
        style,
        processor,
    };
}

export const TagHandlerMap: Record<string, TagHandler> = {
    A: createTagHandler(inline, generalProcessor),
    B: createTagHandler(b, generalProcessor),
    BODY: createTagHandler(block, generalProcessor), // TODO
    BLOCKQUOTE: createTagHandler(blockquote, generalProcessor), // TODO
    BR: createTagHandler(block, brProcessor),
    CENTER: createTagHandler(center, generalProcessor),
    CODE: createTagHandler(block, generalProcessor), // TODO
    DIV: createTagHandler(block, generalProcessor),
    EM: createTagHandler(i, generalProcessor),
    FONT: createTagHandler(font, generalProcessor),
    I: createTagHandler(i, generalProcessor),
    IMG: createTagHandler(inline, imageProcessor),
    H1: createTagHandler(block, generalProcessor), // TODO
    H2: createTagHandler(block, generalProcessor), // TODO
    H3: createTagHandler(block, generalProcessor), // TODO
    H4: createTagHandler(block, generalProcessor), // TODO
    H5: createTagHandler(block, generalProcessor), // TODO
    H6: createTagHandler(block, generalProcessor), // TODO
    HR: createTagHandler(block, generalProcessor), // TODO
    LI: createTagHandler(li, generalProcessor), // TODO
    OL: createTagHandler(block, generalProcessor), // TODO
    P: createTagHandler(p, generalProcessor),
    PRE: createTagHandler(pre, generalProcessor),
    S: createTagHandler(strike, generalProcessor),
    SPAN: createTagHandler(inline, generalProcessor),
    STRIKE: createTagHandler(strike, generalProcessor),
    STRONG: createTagHandler(b, generalProcessor),
    SUB: createTagHandler(sub, generalProcessor),
    SUP: createTagHandler(sup, generalProcessor),
    TABLE: createTagHandler(block, tableProcessor),
    TD: createTagHandler(block, generalProcessor),
    U: createTagHandler(u, generalProcessor),
    UL: createTagHandler(block, generalProcessor), // TODO
};
