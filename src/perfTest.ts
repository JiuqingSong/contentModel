// import createFragment from './interfaceBasedContentModel/createFragment';
// import createInterfaceBasedContentModel from './interfaceBasedContentModel/createContentModel';
// // import { TestData1, TestData2, TestData3 } from './testData';
// import { toArray } from 'roosterjs-editor-dom';
// // import createClassBasedContentModel from './classBasedContentModel/createContentModel';

// export default function perfTest() {
//     console.log('start');

//     runPerfTest(TestData1, 'Test1');
//     runPerfTest(TestData2, 'Test2');
//     runPerfTest(TestData3, 'Test3');

//     console.log('done');
// }

// function getDepth(root: Node): number {
//     const subDepth = toArray(root.childNodes).map(n => getDepth(n));
//     const max = Math.max(0, ...subDepth);

//     return max + 1;
// }

// function runPerfTest(data: string, testId: string) {
//     const body = new DOMParser().parseFromString(data, 'text/html').body;
//     const TestCount = 1;
//     console.log(
//         `${testId}: Length: ${data.length}, Elements: ${
//             body.getElementsByTagName('*').length
//         }, Depth: ${getDepth(body)}`
//     );

//     const interfaceBasedMarkerNames = getMarkerNames('interface', testId);
//     const classBasedMarkerNames = getMarkerNames('class', testId);

//     // let m1_ = createInterfaceBasedContentModel(body, null);
//     // let m2_ = createClassBasedContentModel(body, null);

//     let m1 = createInterfaceBasedContentModel(body, null);
//     // let m2 = createClassBasedContentModel(body, null);
//     let d1 = [];
//     let d2 = [];

//     performance.mark(classBasedMarkerNames.start);

//     for (let i = 0; i < TestCount; i++) {
//         // m2[i] = createClassBasedContentModel(body, null);
//     }

//     performance.mark(classBasedMarkerNames.middle);

//     for (let i = 0; i < TestCount; i++) {
//         // d2[i] = m2[i].createFragment();
//     }

//     performance.mark(classBasedMarkerNames.end);

//     performance.mark(interfaceBasedMarkerNames.start);

//     for (let i = 0; i < TestCount; i++) {
//         m1[i] = createInterfaceBasedContentModel(body, null);
//     }

//     performance.mark(interfaceBasedMarkerNames.middle);

//     for (let i = 0; i < TestCount; i++) {
//         d1[i] = createFragment(document, m1[i]);
//     }

//     performance.mark(interfaceBasedMarkerNames.end);

//     const measure1 = performance.measure(
//         `measure_interface_create`,
//         interfaceBasedMarkerNames.start,
//         interfaceBasedMarkerNames.middle
//     );
//     const measure2 = performance.measure(
//         `measure_interface_todom`,
//         interfaceBasedMarkerNames.middle,
//         interfaceBasedMarkerNames.end
//     );
//     const measure3 = performance.measure(
//         `measure_class_create`,
//         classBasedMarkerNames.start,
//         classBasedMarkerNames.middle
//     );
//     const measure4 = performance.measure(
//         `measure_class_todom`,
//         classBasedMarkerNames.middle,
//         classBasedMarkerNames.end
//     );

//     console.log([measure1, measure2, measure3, measure4].map(m => m.duration));

//     // (<any>window)[testId] = [m1, m2, d1, d2];
// }

// function getMarkerNames(category: string, testId: string) {
//     const name = `ContentModelPerf_${category}_${testId}_`;

//     return {
//         start: name + 'Start',
//         middle: name + 'Middle',
//         end: name + 'End',
//     };
// }
