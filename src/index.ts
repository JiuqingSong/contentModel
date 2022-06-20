import createClassBasedContentModel from './classBasedContentModel/createContentModel';
import createFragment from './interfaceBasedContentModel/createFragment';
import createInterfaceBasedContentModel from './interfaceBasedContentModel/createContentModel';
import getSelectedSegments from './interfaceBasedContentModel/getSelectedSegments';
import { ContentModel_Document } from './interfaceBasedContentModel/types/Block';
import { Editor } from 'roosterjs-editor-core';
import { IEditor } from 'roosterjs-editor-types';
import { TestData1, TestData2, TestData3 } from './testData';
import { toArray } from 'roosterjs';
// import { ContentModel_Document } from './classBasedContentModel/ContentModel';

const sourceEl = document.getElementById('source') as HTMLTextAreaElement;
const layoutEl = document.getElementById('layout') as HTMLDivElement;
const modelEl = document.getElementById('model') as HTMLTextAreaElement;
const modelHtmlEl = document.getElementById('modelHTML') as HTMLTextAreaElement;
const modelLayoutEl = document.getElementById('modelLayout') as HTMLDivElement;
const editor: IEditor = new Editor(modelLayoutEl);

const btnBold = document.getElementById('btnBold') as HTMLButtonElement;
const btnItalic = document.getElementById('btnItalic') as HTMLButtonElement;
const btnUnderline = document.getElementById('btnUnderline') as HTMLButtonElement;
const btnPerf = document.getElementById('btnPerf') as HTMLButtonElement;

sourceEl.textContent = '<table><tr><td>1</td></tr></table>';

sourceEl.addEventListener('input', updateLayout);
btnBold.addEventListener('click', bold);
btnItalic.addEventListener('click', italic);
btnUnderline.addEventListener('click', underline);
btnPerf.addEventListener('click', perfTest);

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
    const model = createInterfaceBasedContentModel(
        source,
        source == modelLayoutEl ? editor.getSelectionRange() : null
    );
    modelEl.value = JSON.stringify(model, null, 4);

    return model;
}

function updateResult(model: ContentModel_Document, updateSelection: boolean) {
    modelLayoutEl.innerHTML = '';

    const [fragment, context] = createFragment(document, model);
    // const [fragment, context] = model.createFragment();
    modelLayoutEl.appendChild(fragment);
    modelHtmlEl.value = modelLayoutEl.innerHTML;

    if (updateSelection && context.startContainer && context.endContainer) {
        editor.focus();
        editor.select(
            context.startContainer.firstChild,
            context.startOffset,
            context.endContainer.firstChild,
            context.endOffset
        );
    }
}

function bold() {
    const model = updateContentModel(modelLayoutEl);
    const segments = getSelectedSegments(model);
    // const segments = model.getSelectedSegments();
    const toUnbold = segments.every(seg => seg.format.bold);

    segments.forEach(seg => (seg.format.bold = !toUnbold));

    updateResult(model, true);
}

function italic() {
    const model = updateContentModel(modelLayoutEl);
    const segments = getSelectedSegments(model);
    // const segments = model.getSelectedSegments();
    const toUnitalic = segments.every(seg => seg.format.italic);

    segments.forEach(seg => (seg.format.italic = !toUnitalic));

    updateResult(model, true);
}

function underline() {
    const model = updateContentModel(modelLayoutEl);
    const segments = getSelectedSegments(model);
    // const segments = model.getSelectedSegments();
    const toUnunderline = segments.every(seg => seg.format.underline);
    segments.forEach(seg => (seg.format.underline = !toUnunderline));
    updateResult(model, true);
}

function perfTest() {
    console.log('start');

    runPerfTest(TestData1, 'Test1');
    runPerfTest(TestData2, 'Test2');
    runPerfTest(TestData3, 'Test3');

    console.log('done');
}

function getDepth(root: Node): number {
    const subDepth = toArray(root.childNodes).map(n => getDepth(n));
    const max = Math.max(0, ...subDepth);

    return max + 1;
}

function runPerfTest(data: string, testId: string) {
    const body = new DOMParser().parseFromString(data, 'text/html').body;
    const TestCount = 100;
    console.log(
        `${testId}: Length: ${data.length}, Elements: ${
            body.getElementsByTagName('*').length
        }, Depth: ${getDepth(body)}`
    );

    const interfaceBasedMarkerNames = getMarkerNames('interface', testId);
    const classBasedMarkerNames = getMarkerNames('class', testId);

    // let m1_ = createInterfaceBasedContentModel(body, null);
    let m2_ = createClassBasedContentModel(body, null);

    let m1 = []; //createInterfaceBasedContentModel(body, null);
    let m2 = []; // createClassBasedContentModel(body, null);
    let d1 = [];
    let d2 = [];

    // performance.mark(classBasedMarkerNames.start);

    for (let i = 0; i < TestCount; i++) {
        m2[i] = createClassBasedContentModel(body, null);
    }

    // performance.mark(classBasedMarkerNames.middle);

    // for (let i = 0; i < TestCount; i++) {
    //     d2[i] = m2_.createFragment();
    // }

    // performance.mark(classBasedMarkerNames.end);

    // performance.mark(interfaceBasedMarkerNames.start);

    // for (let i = 0; i < TestCount; i++) {
    //     m1[i] = createInterfaceBasedContentModel(body, null);
    // }

    // performance.mark(interfaceBasedMarkerNames.middle);

    // for (let i = 0; i < TestCount; i++) {
    //     d1[i] = createFragment(document, m1_);
    // }

    // performance.mark(interfaceBasedMarkerNames.end);

    // const measure1 = performance.measure(
    //     `measure_interface_create`,
    //     interfaceBasedMarkerNames.start,
    //     interfaceBasedMarkerNames.middle
    // );
    // const measure2 = performance.measure(
    //     `measure_interface_todom`,
    //     interfaceBasedMarkerNames.middle,
    //     interfaceBasedMarkerNames.end
    // );
    // const measure3 = performance.measure(
    //     `measure_class_create`,
    //     classBasedMarkerNames.start,
    //     classBasedMarkerNames.middle
    // );
    // const measure4 = performance.measure(
    //     `measure_class_todom`,
    //     classBasedMarkerNames.middle,
    //     classBasedMarkerNames.end
    // );

    // console.log([measure1, measure2, measure3, measure4].map(m => m.duration));

    (<any>window)[testId] = [m1, m2, d1, d2];
}

function getMarkerNames(category: string, testId: string) {
    const name = `ContentModelPerf_${category}_${testId}_`;

    return {
        start: name + 'Start',
        middle: name + 'Middle',
        end: name + 'End',
    };
}

updateLayout();
