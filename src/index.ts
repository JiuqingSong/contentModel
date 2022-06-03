import createContentModel from './createContentModel';
import createFragment from './createFragment';
import { ContentModel, Segment, SelectionType } from './ContentMode';

const sourceEl = document.getElementById('source') as HTMLTextAreaElement;
const layoutEl = document.getElementById('layout') as HTMLDivElement;
const modelEl = document.getElementById('model') as HTMLTextAreaElement;
const modelHtmlEl = document.getElementById('modelHTML') as HTMLTextAreaElement;
const modelLayoutEl = document.getElementById('modelLayout') as HTMLDivElement;

const btnBold = document.getElementById('btnBold') as HTMLButtonElement;
const btnItalic = document.getElementById('btnItalic') as HTMLButtonElement;
const btnUnderline = document.getElementById('btnUnderline') as HTMLButtonElement;

const initHTML =
    '<span style="font-size: 40px">test</span>' +
    '<div><div class="rps_138"><div><p><span style="font-size:10pt; font-family:arial,helvetica,sans-serif"><font face="arial,helvetica,sans-serif"><span data-markjs="true" class="markkjbu6bh8k LMEtD">Congratulations</span>! Our records indicate you recently had one or more Stock Awards vest. Please find important information below regarding your vest.<br aria-hidden="true"></font><b><u><br aria-hidden="true"><font face="arial,helvetica,sans-serif">Share Deposit<br aria-hidden="true"></font></u></b><font face="arial,helvetica,sans-serif">Please go to your account online with <strong>Fidelity </strong>to view your share deposit.&nbsp; <br aria-hidden="true"><br aria-hidden="true">Need help accessing your shares at Fidelity?&nbsp; Please review <span style="color: rgb(255, 255, 255) !important;" data-ogsc="black"><a href="https://nam06.safelinks.protection.outlook.com/?url=https%3A%2F%2Faka.ms%2Fstockbrokercontacts&amp;data=05%7C01%7Cjisong%40microsoft.com%7Cc91b4da57665423cd4fb08da43ec8474%7C72f988bf86f141af91ab2d7cd011db47%7C0%7C0%7C637896980359446485%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000%7C%7C%7C&amp;sdata=MTY0C7SidOiVK5JdLmjOGYb2dlkVLFmVvnu4iY9Mlg8%3D&amp;reserved=0" target="_blank" rel="noopener noreferrer" data-auth="Verified" originalsrc="https://aka.ms/stockbrokercontacts" shash="k2SVJ88nF+K8GFOYNXzr1w+AW0gr3+vOhga7fnqbhOnm6Ltft1ifXrB/fl5OlyIDJddTXxKoiMzUorpA+Ajh1lZpD7oI5S0rzHjuFd+KqW59UO20qHihT5cPk/vczdXg2nrksiLb6wdBoO7CmvEHI0aCUM50LopVbJnQ3Iv8kqE=" title="Original URL: https://aka.ms/stockbrokercontacts. Click or tap if you trust this link." data-linkindex="0" data-ogsc="" style="color: rgb(228, 159, 255) !important;">Gaining Access to Your Fidelity or Morgan Stanley Account</a>.</span><br aria-hidden="true"></font><b><u><br aria-hidden="true"><font face="arial,helvetica,sans-serif">Tax Information<br aria-hidden="true"></font></u></b><font face="arial,helvetica,sans-serif">A Stock Award vest is considered a taxable event for employees in the US. Taxes were withheld in the form of shares to cover the minimum statutory withholding (unless exceptional rates applied). Effective January 1, 2022, Microsoft withholds fractional shares to cover the taxes instead of rounding up to the next whole share. Fractional net shares are deposited into your account.&nbsp;<br aria-hidden="true"></font></span></p><p><span style="font-family:arial,helvetica,sans-serif; font-size:10pt"><font face="arial,helvetica,sans-serif"><font size="2">You may view the transaction details by clicking on the Excel icon under the Personal Details widget on the <a href="https://nam06.safelinks.protection.outlook.com/?url=https%3A%2F%2Faka.ms%2Fstock&amp;data=05%7C01%7Cjisong%40microsoft.com%7Cc91b4da57665423cd4fb08da43ec8474%7C72f988bf86f141af91ab2d7cd011db47%7C0%7C0%7C637896980359446485%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000%7C%7C%7C&amp;sdata=ODjDZ%2BubocdmQx2%2B5OlMIbBq9VuUOnvliv0%2Fy6F95Bw%3D&amp;reserved=0" target="_blank" rel="noreferrer noopener" data-auth="Verified" originalsrc="https://aka.ms/stock" shash="hzBmHivkT/vocq4EISUIAkbkD9plXKnvM7t7iwXQsle1g2kTRzIQrGkQp2tNlLMY8IgfS89EsZe9Hjtig1jc1B1UYgnHna67hfmaG5ocUXBDUTpqvCbkMKMmC4YeZwB4TUNSG2miRoiigH5A38SirAiTMbP3rwvfw6vn2a2lRPA=" title="Original URL: https://aka.ms/stock. Click or tap if you trust this link." data-linkindex="1" data-ogsc="" style="color: rgb(228, 159, 255) !important;">Total Rewards Portal</a></font></font><font size="2"><font face="arial,helvetica,sans-serif">.</font></font></span></p><p><span style="font-family:arial,helvetica,sans-serif; font-size:10pt"><span><font face="arial,helvetica,sans-serif">Additional tax information is available on <span style="color: rgb(255, 255, 255) !important;" data-ogsc="black"><a href="https://nam06.safelinks.protection.outlook.com/?url=https%3A%2F%2Faka.ms%2Fstockawardshome&amp;data=05%7C01%7Cjisong%40microsoft.com%7Cc91b4da57665423cd4fb08da43ec8474%7C72f988bf86f141af91ab2d7cd011db47%7C0%7C0%7C637896980359446485%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000%7C%7C%7C&amp;sdata=jJ8Cc8vD9fT2qEP7%2FApx28gIgB%2B%2BvAgiR7Uejv9na7I%3D&amp;reserved=0" target="_blank" rel="noopener noreferrer" data-auth="Verified" originalsrc="https://aka.ms/stockawardshome" shash="G6pVH+OXzHANu9C9P1Im+FNl3WotuCljFik1u1+NOExEZgGRdE13BeP97mqI7I2l5gc0kombGiEbiAUD+fVcQ4FhcXAWjGiROgPgSFNoKVBms5ayhTbCON8pvF/8oE8zDKLhYwv34ihPEmegSgez2tw9SHKpLmi32WKFzekDLhw=" title="Original URL: https://aka.ms/stockawardshome. Click or tap if you trust this link." data-linkindex="2" data-ogsc="" style="color: rgb(228, 159, 255) !important;">HRWeb</a>.</span><br aria-hidden="true"></font><span class="x_baec5a81-e4d6-4674-97f3-e9220f0136c1" style="white-space:nowrap"><font face="arial,helvetica,sans-serif"><span class="x_baec5a81"><span style="color: rgb(255, 255, 255) !important;" data-ogsc="black"><br aria-hidden="true"></span></span></font></span></span><b><u><font size="2" face="arial,helvetica,sans-serif">Resources</font></u></b></span></p><ul><li><span style="font-size:10pt; font-family:arial,helvetica,sans-serif">Watch this <a href="https://nam06.safelinks.protection.outlook.com/?url=https%3A%2F%2Fmsit.microsoftstream.com%2Fvideo%2Faa9d0840-98dc-ae70-35d5-f1ec09f64c30&amp;data=05%7C01%7Cjisong%40microsoft.com%7Cc91b4da57665423cd4fb08da43ec8474%7C72f988bf86f141af91ab2d7cd011db47%7C0%7C0%7C637896980359446485%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000%7C%7C%7C&amp;sdata=K%2FqMG4m66UegBONZi%2BR9KNWWTFHacW80JBAQJUgHj5E%3D&amp;reserved=0" target="_blank" rel="noopener noreferrer" data-auth="Verified" originalsrc="https://msit.microsoftstream.com/video/aa9d0840-98dc-ae70-35d5-f1ec09f64c30" shash="yaLLeaWWxFvahehgFpQFHcRfZ7U2tjY4TnF7g4fPfrxG3HgDj9420c/DZEsQGpquFTihd/wV3roEVgD1E/jSMzD3giX6L9Kx5S4P4D28VWh2bBbLp6Um2zfx50RusTfnBygjVwsCz6Lc2GlkrHh6O1u1HxvwNzyP8vphoNTvPjA=" title="Original URL: https://msit.microsoftstream.com/video/aa9d0840-98dc-ae70-35d5-f1ec09f64c30. Click or tap if you trust this link." data-linkindex="3" data-ogsc="" style="color: rgb(228, 159, 255) !important;"><font size="2" face="arial,helvetica,sans-serif">short video</font></a><font size="2" face="arial,helvetica,sans-serif"> on Stock Awards.</font></span></li><li><span style="font-size:10pt; font-family:arial,helvetica,sans-serif"><font size="2" face="arial,helvetica,sans-serif"><a href="https://nam06.safelinks.protection.outlook.com/?url=https%3A%2F%2Ffkn.financialknowledge.net%2F%3Fidp%3DMSFT&amp;data=05%7C01%7Cjisong%40microsoft.com%7Cc91b4da57665423cd4fb08da43ec8474%7C72f988bf86f141af91ab2d7cd011db47%7C0%7C0%7C637896980359602704%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000%7C%7C%7C&amp;sdata=UnZctJS8v0y%2FoxGr8z%2F1H4wBaRPLdRY1STwk8rPYVAo%3D&amp;reserved=0" target="_blank" rel="noopener noreferrer" data-auth="Verified" originalsrc="https://fkn.financialknowledge.net/?idp=MSFT" shash="qfnGH4VcQ/wSD/VFDcPUeCpr56ZfioHJh+qLD37Azg7HuAtNlCH29kQ3RIRoOcoCZjdEQEDgROfwsYLGqode+XZZzN4tuwGCnrZctDRg7AwUN/ZLqpObWEOi7mfKyAJT7pHJMesSfCzxnzXepCRvlptshOeLNC96pUIJ72A3KU4=" title="Original URL: https://fkn.financialknowledge.net/?idp=MSFT. Click or tap if you trust this link." data-linkindex="4" data-ogsc="" style="color: rgb(228, 159, 255) !important;">Register</a> for a free Financial Knowledge seminar to learn more about your Stock Awards and the tax implications.</font></span></li><li><span style="font-size:10pt; font-family:arial,helvetica,sans-serif"><font size="2" face="arial,helvetica,sans-serif">View the details of your Stock Awards and your upcoming vests from your phone - just one of the many things you can do on the <a href="https://nam06.safelinks.protection.outlook.com/?url=https%3A%2F%2Fmicrosoft.sharepoint.com%2Fteams%2FMicrosoftMyHub%2FSitePages%2FHome.aspx%3Fwt.mc_id%3DMCSS_MyHub_StockAward_Email_2021&amp;data=05%7C01%7Cjisong%40microsoft.com%7Cc91b4da57665423cd4fb08da43ec8474%7C72f988bf86f141af91ab2d7cd011db47%7C0%7C0%7C637896980359602704%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000%7C%7C%7C&amp;sdata=4p49LnbeRtTS46WrjYyeUxFFdwsBLQ1zAP%2FY%2FpI03t8%3D&amp;reserved=0" target="_blank" rel="noopener noreferrer" data-auth="Verified" originalsrc="https://microsoft.sharepoint.com/teams/MicrosoftMyHub/SitePages/Home.aspx?wt.mc_id=MCSS_MyHub_StockAward_Email_2021" shash="o9EVeGt3D6jiumkpkLIHYvlHtHRW7rFgW70VttQA52z2ueyJEbF/h/J5yskWtI703R53aCenUvCTgeQ4LhlzYSKcUgEeSYNnc/I/nuQpRjd06Qwz/Z/a4Rw1/AutQn4phAoiH9dof92ZVTg3oi27RH9JuM7b02CtKFqsN1Qt6Tg=" title="Original URL: https://microsoft.sharepoint.com/teams/MicrosoftMyHub/SitePages/Home.aspx?wt.mc_id=MCSS_MyHub_StockAward_Email_2021. Click or tap if you trust this link." data-linkindex="5" data-ogsc="" style="color: rgb(228, 159, 255) !important;">Microsoft MyHub app.</a></font></span></li></ul><ul></ul><p><span style="font-size:10pt; font-family:arial,helvetica,sans-serif"><span class="x_baec5a81-e4d6-4674-97f3-e9220f0136c1" style="white-space:nowrap"><font face="arial,helvetica,sans-serif"><span class="x_baec5a81"><span style="color: rgb(255, 255, 255) !important;" data-ogsc="black"></span></span></font></span><font face="arial,helvetica,sans-serif"></font></span></p><p><span style="font-size:10pt; font-family:arial,helvetica,sans-serif"><font face="arial,helvetica,sans-serif"><font face="arial,helvetica,sans-serif"><span data-markjs="true" class="markkjbu6bh8k LMEtD">Congratulations</span> again&nbsp;on your&nbsp;Stock Award vest.&nbsp;</font>&nbsp;&nbsp; </font></span></p></div></div></div>';

sourceEl.value = initHTML;

function updateLayout() {
    const html = sourceEl.value;
    layoutEl.innerHTML = html;
    const model = calc();
    render(model);
}

function calc() {
    const model = createContentModel(layoutEl);
    modelEl.value = JSON.stringify(model, null, 4);

    return model;
}

function render(model: ContentModel, updateSource?: boolean) {
    const modelFragment = createFragment(model, document);
    while (modelLayoutEl.firstChild) {
        modelLayoutEl.removeChild(modelLayoutEl.firstChild);
    }

    modelLayoutEl.appendChild(modelFragment);
    modelHtmlEl.value = modelLayoutEl.innerHTML;

    if (updateSource) {
        layoutEl.innerHTML = modelLayoutEl.innerHTML;
    }
}

function getSelectedSegments(model: ContentModel) {
    const selectedSegments: Segment[] = [];
    let isInSelection = false;

    for (let i = 0; i < model.blocks.length; i++) {
        const block = model.blocks[i];

        for (let j = 0; j < block.segments.length; j++) {
            const seg = block.segments[j];

            if (seg.selection === SelectionType.Start) {
                isInSelection = true;
            } else if (seg.selection === SelectionType.End) {
                isInSelection = false;
            } else if (isInSelection) {
                selectedSegments.push(seg);
            }
        }
    }

    return selectedSegments;
}

function bold() {
    const model = calc();
    const selectedSegments = getSelectedSegments(model);
    const turnOff = selectedSegments.every(seg => seg.format.bold);

    selectedSegments.forEach(seg => (seg.format.bold = !turnOff));

    render(model, true);
}

function italic() {
    const model = calc();
    const selectedSegments = getSelectedSegments(model);
    const turnOff = selectedSegments.every(seg => seg.format.italic);

    selectedSegments.forEach(seg => (seg.format.italic = !turnOff));

    render(model, true);
}

function underline() {
    const model = calc();
    const selectedSegments = getSelectedSegments(model);
    const turnOff = selectedSegments.every(seg => seg.format.underline);

    selectedSegments.forEach(seg => (seg.format.underline = !turnOff));

    render(model, true);
}

sourceEl.addEventListener('input', updateLayout);
document.addEventListener('selectionchange', calc);

btnBold.addEventListener('click', bold);
btnItalic.addEventListener('click', italic);
btnUnderline.addEventListener('click', underline);

updateLayout();
