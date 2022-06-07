import createContentModel from './contentModel/createContentModel';
import createFragment from './contentModel/createFragment';
import getSelectedSegments from './contentModel/getSelectedSegments';
import { ContentModel_Document } from './contentModel/Block';
import { Editor } from 'roosterjs-editor-core';
import { IEditor } from 'roosterjs-editor-types';

const sourceEl = document.getElementById('source') as HTMLTextAreaElement;
const layoutEl = document.getElementById('layout') as HTMLDivElement;
const modelEl = document.getElementById('model') as HTMLTextAreaElement;
const modelHtmlEl = document.getElementById('modelHTML') as HTMLTextAreaElement;
const modelLayoutEl = document.getElementById('modelLayout') as HTMLDivElement;
const editor: IEditor = new Editor(modelLayoutEl);

const btnBold = document.getElementById('btnBold') as HTMLButtonElement;
const btnItalic = document.getElementById('btnItalic') as HTMLButtonElement;
const btnUnderline = document.getElementById('btnUnderline') as HTMLButtonElement;

sourceEl.textContent = '<table><tr><td>1</td></tr></table>';

sourceEl.addEventListener('input', updateLayout);
btnBold.addEventListener('click', bold);
btnItalic.addEventListener('click', italic);
btnUnderline.addEventListener('click', underline);

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
    const model = createContentModel(
        source,
        source == modelLayoutEl ? editor.getSelectionRange() : null
    );
    modelEl.value = JSON.stringify(model, null, 4);

    return model;
}

function updateResult(model: ContentModel_Document, updateSelection: boolean) {
    while (modelLayoutEl.firstChild) {
        modelLayoutEl.removeChild(modelLayoutEl.firstChild);
    }

    const [fragement, context] = createFragment(document, model);
    modelLayoutEl.appendChild(fragement);
    modelHtmlEl.value = modelLayoutEl.innerHTML;

    if (updateSelection && context.startContainer && context.endContainer) {
        editor.runAsync(() => {
            editor.focus();
            editor.select(
                context.startContainer.firstChild,
                context.startOffset,
                context.endContainer.firstChild,
                context.endOffset
            );
        });
    }
}

function bold() {
    const model = updateContentModel(modelLayoutEl);
    const segments = getSelectedSegments(model);
    const toUnbold = segments.every(seg => seg.format.bold);

    segments.forEach(seg => (seg.format.bold = !toUnbold));

    updateResult(model, true);
}

function italic() {
    const model = updateContentModel(modelLayoutEl);
    const segments = getSelectedSegments(model);
    const toUnitalic = segments.every(seg => seg.format.italic);

    segments.forEach(seg => (seg.format.italic = !toUnitalic));

    updateResult(model, true);
}

function underline() {
    const model = updateContentModel(modelLayoutEl);
    const segments = getSelectedSegments(model);
    const toUnunderline = segments.every(seg => seg.format.underline);

    segments.forEach(seg => (seg.format.underline = !toUnunderline));

    updateResult(model, true);
}

updateLayout();
