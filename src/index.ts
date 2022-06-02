import createContentModel, { createFragment } from './contentModel';

const sourceEl = document.getElementById('source') as HTMLTextAreaElement;
const layoutEl = document.getElementById('layout') as HTMLDivElement;
const modelEl = document.getElementById('model') as HTMLTextAreaElement;
const modelHtmlEl = document.getElementById('modelHTML') as HTMLTextAreaElement;
const modelLayoutEl = document.getElementById('modelLayout') as HTMLDivElement;

const initHTML =
    '<div style="text-indent: 20px;" dir="rtl"><span style="color: red; font-weight: 700">test</span></div>';

sourceEl.value = initHTML;

function calc() {
    const html = sourceEl.value;
    layoutEl.innerHTML = html;

    const model = createContentModel(layoutEl);
    const modelFragment = createFragment(model, document);
    modelEl.value = JSON.stringify(model, null, 4);

    while (modelLayoutEl.firstChild) {
        modelLayoutEl.removeChild(modelLayoutEl.firstChild);
    }

    modelLayoutEl.appendChild(modelFragment);
    modelHtmlEl.value = modelLayoutEl.innerHTML;
}

sourceEl.addEventListener('input', calc);

calc();
