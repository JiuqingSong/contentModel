import addRangeToSelection from './utils/addRangeToSelection';
import createFragment from './interfaceBasedContentModel/createFragment';
import createInterfaceBasedContentModel from './interfaceBasedContentModel/createContentModel';
import getSelectedSegments from './interfaceBasedContentModel/getSelectedSegments';
import { ContentModel_Document } from './interfaceBasedContentModel/types/Block';
import { ContentModel_SegmentType } from './interfaceBasedContentModel/types/Segment';

const sourceEl = document.getElementById('source') as HTMLTextAreaElement;
const layoutEl = document.getElementById('layout') as HTMLDivElement;
const modelEl = document.getElementById('model') as HTMLTextAreaElement;
const modelHtmlEl = document.getElementById('modelHTML') as HTMLTextAreaElement;
const modelLayoutEl = document.getElementById('modelLayout') as HTMLDivElement;

const btnBold = document.getElementById('btnBold') as HTMLButtonElement;
const btnItalic = document.getElementById('btnItalic') as HTMLButtonElement;
const btnUnderline = document.getElementById('btnUnderline') as HTMLButtonElement;
const btnPerf = document.getElementById('btnPerf') as HTMLButtonElement;

sourceEl.textContent = '<table><tr><td>1</td></tr></table>';

sourceEl.addEventListener('input', updateLayout);
btnBold.addEventListener('click', bold);
btnItalic.addEventListener('click', italic);
btnUnderline.addEventListener('click', underline);
// btnPerf.addEventListener('click', perfTest);

document.addEventListener('selectionchange', () => {
    updateContentModel(modelLayoutEl);
});

function updateLayout() {
    const html = sourceEl.value;
    layoutEl.innerHTML = html;

    const model = updateContentModel(layoutEl);

    updateResult(model, false);
}

function updateContentModel(source: Node) {
    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    const model = createInterfaceBasedContentModel(source, source == modelLayoutEl ? range : null);
    modelEl.value = JSON.stringify(model, null, 4);

    return model;
}

function updateResult(model: ContentModel_Document, updateSelection: boolean) {
    modelLayoutEl.innerHTML = '';

    const [fragment, start, end] = createFragment(document, model);
    modelLayoutEl.appendChild(fragment);
    modelHtmlEl.value = modelLayoutEl.innerHTML;

    if (updateSelection && start && end) {
        modelHtmlEl.focus();

        const range = document.createRange();
        range.setStart(start.container, start.offset);
        range.setEnd(end.container, end.offset);
        addRangeToSelection(range);
    }
}

function bold() {
    const model = updateContentModel(modelLayoutEl);
    const segments = getSelectedSegments(model);
    // const segments = model.getSelectedSegments();
    const toUnbold = segments.every(
        seg => seg.type == ContentModel_SegmentType.SelectionMarker || seg.format.bold
    );

    segments.forEach(seg => (seg.format.bold = !toUnbold));

    updateResult(model, true);
}

function italic() {
    const model = updateContentModel(modelLayoutEl);
    const segments = getSelectedSegments(model);
    // const segments = model.getSelectedSegments();
    const toUnitalic = segments.every(
        seg => seg.type == ContentModel_SegmentType.SelectionMarker || seg.format.italic
    );

    segments.forEach(seg => (seg.format.italic = !toUnitalic));

    updateResult(model, true);
}

function underline() {
    const model = updateContentModel(modelLayoutEl);
    const segments = getSelectedSegments(model);
    // const segments = model.getSelectedSegments();
    const toUnunderline = segments.every(
        seg => seg.type == ContentModel_SegmentType.SelectionMarker || seg.format.underline
    );
    segments.forEach(seg => (seg.format.underline = !toUnunderline));
    updateResult(model, true);
}

updateLayout();
