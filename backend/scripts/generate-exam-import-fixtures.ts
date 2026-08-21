import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

import * as XLSX from 'xlsx';

type Question = {
  code: string;
  typeId: 1 | 2 | 3;
  text: string;
  options?: string[];
  correctOption?: string;
  acceptedAnswers?: string[];
  tolerance?: number;
  caseSensitive: boolean;
  explanation: string;
  image?: 'question';
};

type SectionFixture = {
  fileStem: string;
  slotCode: string;
  sectionCode: string;
  sectionName: string;
  subjectCode: string;
  comprehensionCode: string;
  comprehension: string;
  diagram: 'language' | 'quant' | 'reasoning';
  questions: Question[];
};

const fixtures: SectionFixture[] = [
  {
    fileStem: '01-language-english',
    slotCode: 'CUET_SLOT_1',
    sectionCode: 'LANGUAGE',
    sectionName: 'English Language',
    subjectCode: 'ENGLISH',
    comprehensionCode: 'CUET-ENG-PASSAGE-001',
    comprehension:
      'Read the passage and study the communication-flow diagram. Effective revision is not passive rereading. A learner first identifies the central idea, connects it to prior knowledge, retrieves it without looking at the source, and finally checks errors. Retrieval may feel harder than rereading, but that effort strengthens long-term memory. Short, spaced revision sessions are therefore usually more useful than one long session immediately before an examination.',
    diagram: 'language',
    questions: [
      {
        code: 'CUET-ENG-TEST-001',
        typeId: 1,
        text: 'What is the central idea of the passage?',
        options: [
          'Passive rereading is the best revision method.',
          'Active retrieval and spaced revision improve long-term learning.',
          'Revision should only happen immediately before an examination.',
          'Prior knowledge prevents students from finding errors.',
        ],
        correctOption: 'B',
        caseSensitive: false,
        explanation:
          'The passage recommends active retrieval and spaced sessions because they strengthen long-term memory.',
      },
      {
        code: 'CUET-ENG-TEST-002',
        typeId: 1,
        text: 'According to the diagram, which stage comes immediately after connecting the idea?',
        options: ['Identify', 'Retrieve', 'Check errors', 'Repeat'],
        correctOption: 'B',
        caseSensitive: false,
        explanation:
          'The illustrated sequence is Identify, Connect, Retrieve, and Check.',
      },
      {
        code: 'CUET-ENG-TEST-003',
        typeId: 1,
        text: 'Why can retrieval feel more difficult than rereading?',
        options: [
          'It requires the learner to recall information without seeing it.',
          'It removes all connections with prior knowledge.',
          'It only works during long revision sessions.',
          'It prevents learners from checking errors.',
        ],
        correctOption: 'A',
        caseSensitive: false,
        explanation:
          'Retrieval requires recall without looking at the source, creating desirable mental effort.',
      },
      {
        code: 'CUET-ENG-TEST-004',
        typeId: 3,
        text: 'Enter the exact one-word answer with the shown capitalization: A person who is extremely tired is _____.',
        acceptedAnswers: ['Exhausted'],
        caseSensitive: true,
        explanation:
          '“Exhausted” means extremely tired. Case sensitivity is enabled for this test question.',
      },
      {
        code: 'CUET-ENG-TEST-005',
        typeId: 2,
        text: 'How many green stages are shown in the process diagram below?',
        acceptedAnswers: ['4'],
        tolerance: 0,
        caseSensitive: false,
        explanation: 'The diagram contains four distinct green process stages.',
        image: 'question',
      },
    ],
  },
  {
    fileStem: '02-quant-mathematics',
    slotCode: 'CUET_SLOT_1',
    sectionCode: 'QUANT',
    sectionName: 'Quantitative Aptitude',
    subjectCode: 'MATHEMATICS',
    comprehensionCode: 'CUET-QUANT-CHART-001',
    comprehension:
      'The bar chart represents practice questions solved by four study groups during one week. Group A solved 120 questions, Group B solved 150, Group C solved 180, and Group D solved 210. Use these values for Questions 1 to 3.',
    diagram: 'quant',
    questions: [
      {
        code: 'CUET-QUANT-TEST-001',
        typeId: 2,
        text: 'How many more questions did Group D solve than Group A?',
        acceptedAnswers: ['90'],
        tolerance: 0,
        caseSensitive: false,
        explanation: '210 minus 120 equals 90.',
      },
      {
        code: 'CUET-QUANT-TEST-002',
        typeId: 2,
        text: 'What was the percentage increase from Group A to Group B?',
        acceptedAnswers: ['25', '25.0'],
        tolerance: 0.01,
        caseSensitive: false,
        explanation:
          'The increase is 30; 30 divided by 120 and multiplied by 100 equals 25%.',
      },
      {
        code: 'CUET-QUANT-TEST-003',
        typeId: 2,
        text: 'Find the average number of questions solved by the four groups.',
        acceptedAnswers: ['165'],
        tolerance: 0,
        caseSensitive: false,
        explanation: '(120 + 150 + 180 + 210) divided by 4 equals 165.',
      },
      {
        code: 'CUET-QUANT-TEST-004',
        typeId: 1,
        text: 'The diagram shows a rectangle of length 12 cm and width 8 cm. What is its area?',
        options: ['20 cm²', '40 cm²', '96 cm²', '120 cm²'],
        correctOption: 'C',
        caseSensitive: false,
        explanation: 'Area equals length multiplied by width: 12 × 8 = 96 cm².',
        image: 'question',
      },
      {
        code: 'CUET-QUANT-TEST-005',
        typeId: 3,
        text: 'Name the quadrilateral shown in the diagram using one word.',
        acceptedAnswers: ['rectangle', 'Rectangle'],
        caseSensitive: false,
        explanation: 'A quadrilateral with four right angles is a rectangle.',
        image: 'question',
      },
    ],
  },
  {
    fileStem: '03-reasoning-logical-reasoning',
    slotCode: 'CUET_SLOT_1',
    sectionCode: 'REASONING',
    sectionName: 'Logical Reasoning',
    subjectCode: 'REASONING',
    comprehensionCode: 'CUET-REA-SEATING-001',
    comprehension:
      'Six students A, B, C, D, E, and F sit around a circular table facing the centre. Their clockwise order, beginning at the top, is A, B, C, D, E, and F. Use the seating diagram for Questions 1 to 3.',
    diagram: 'reasoning',
    questions: [
      {
        code: 'CUET-REA-TEST-001',
        typeId: 1,
        text: 'Who sits directly opposite A?',
        options: ['B', 'C', 'D', 'F'],
        correctOption: 'C',
        caseSensitive: false,
        explanation:
          'With six equally spaced seats, D is three positions from A and therefore opposite A.',
      },
      {
        code: 'CUET-REA-TEST-002',
        typeId: 1,
        text: 'Who is the immediate clockwise neighbour of A?',
        options: ['B', 'C', 'E', 'F'],
        correctOption: 'A',
        caseSensitive: false,
        explanation:
          'The given clockwise order begins A, B, so B is immediately clockwise from A.',
      },
      {
        code: 'CUET-REA-TEST-003',
        typeId: 1,
        text: 'Who sits between C and E in the clockwise order?',
        options: ['A', 'B', 'D', 'F'],
        correctOption: 'C',
        caseSensitive: false,
        explanation:
          'The clockwise sequence includes C, D, E; therefore D sits between C and E.',
      },
      {
        code: 'CUET-REA-TEST-004',
        typeId: 3,
        text: 'Complete the letter-pair sequence with exact uppercase letters: AZ, BY, CX, DW, _____.',
        acceptedAnswers: ['EV'],
        caseSensitive: true,
        explanation:
          'The first letter moves forward while the second moves backward, producing EV.',
      },
      {
        code: 'CUET-REA-TEST-005',
        typeId: 2,
        text: 'Study the visual number pattern 2, 6, 12, 20. Enter the next number.',
        acceptedAnswers: ['30'],
        tolerance: 0,
        caseSensitive: false,
        explanation:
          'The terms are n(n+1): 1×2, 2×3, 3×4, 4×5, so the next is 5×6 = 30.',
        image: 'question',
      },
    ],
  },
];

function crc32(data: Buffer) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(entries: Array<{ name: string; data: Buffer | string }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const data = Buffer.isBuffer(entry.data)
      ? entry.data
      : Buffer.from(entry.data, 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + data.length;
  }
  const directory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, directory, end]);
}

function pngChunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(
    crc32(Buffer.concat([typeBuffer, data])),
    8 + data.length,
  );
  return chunk;
}

function diagram(kind: SectionFixture['diagram'], variant: number) {
  const width = 640;
  const height = 300;
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height, 255);
  for (let y = 0; y < height; y += 1) raw[y * stride] = 0;
  const pixel = (x: number, y: number, color: number[]) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const offset = y * stride + 1 + x * 4;
    raw[offset] = color[0];
    raw[offset + 1] = color[1];
    raw[offset + 2] = color[2];
    raw[offset + 3] = color[3] ?? 255;
  };
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    color: number[],
  ) => {
    for (let row = y; row < y + h; row += 1)
      for (let col = x; col < x + w; col += 1) pixel(col, row, color);
  };
  const circle = (cx: number, cy: number, radius: number, color: number[]) => {
    for (let y = -radius; y <= radius; y += 1)
      for (let x = -radius; x <= radius; x += 1)
        if (x * x + y * y <= radius * radius) pixel(cx + x, cy + y, color);
  };
  const line = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: number[],
    thickness = 4,
  ) => {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let step = 0; step <= steps; step += 1) {
      const x = Math.round(x1 + ((x2 - x1) * step) / steps);
      const y = Math.round(y1 + ((y2 - y1) * step) / steps);
      rect(
        x - Math.floor(thickness / 2),
        y - Math.floor(thickness / 2),
        thickness,
        thickness,
        color,
      );
    }
  };
  const green = [10, 157, 112, 255];
  const navy = [30, 52, 80, 255];
  const pale = [224, 245, 237, 255];
  rect(0, 0, width, height, [249, 252, 251, 255]);
  if (kind === 'language') {
    const count = 4;
    for (let index = 0; index < count; index += 1) {
      rect(50 + index * 145, 105, 105, 70, index % 2 ? pale : green);
      if (index < count - 1)
        line(155 + index * 145, 140, 190 + index * 145, 140, navy, 5);
    }
    if (variant) {
      for (let index = 0; index < 4; index += 1)
        circle(110 + index * 140, 235, 18, green);
    }
  } else if (kind === 'quant') {
    if (!variant) {
      const heights = [90, 120, 150, 180];
      heights.forEach((barHeight, index) =>
        rect(
          90 + index * 125,
          245 - barHeight,
          70,
          barHeight,
          index % 2 ? green : navy,
        ),
      );
      line(55, 245, 590, 245, navy, 4);
    } else {
      rect(145, 70, 350, 170, pale);
      line(145, 70, 495, 70, green, 7);
      line(495, 70, 495, 240, green, 7);
      line(495, 240, 145, 240, green, 7);
      line(145, 240, 145, 70, green, 7);
      rect(150, 75, 28, 28, navy);
      rect(462, 207, 28, 28, navy);
    }
  } else if (!variant) {
    circle(320, 150, 72, pale);
    const seats = [
      [320, 40],
      [430, 95],
      [430, 205],
      [320, 260],
      [210, 205],
      [210, 95],
    ];
    seats.forEach(([x, y], index) =>
      circle(x, y, 29, index % 2 ? green : navy),
    );
  } else {
    const sizes = [28, 44, 60, 76, 92];
    sizes.forEach((size, index) => {
      rect(45 + index * 118, 220 - size, 74, size, index % 2 ? green : navy);
      circle(82 + index * 118, 245, 9, green);
    });
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function paragraph(
  value: string,
  style?: 'Heading1' | 'Heading2' | 'Heading3',
) {
  return `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}<w:r><w:t xml:space="preserve">${escapeXml(value)}</w:t></w:r></w:p>`;
}

function imageParagraph(relationshipId: string, id: number, name: string) {
  return `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="5486400" cy="2571750"/><wp:docPr id="${id}" name="${escapeXml(name)}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${escapeXml(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="5486400" cy="2571750"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

function table(
  rows: Array<[string, { text?: string; image?: boolean }]>,
  imageId: number,
  relationshipId = 'rId2',
) {
  return `<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D8E2E9"/><w:left w:val="single" w:sz="4" w:color="D8E2E9"/><w:bottom w:val="single" w:sz="4" w:color="D8E2E9"/><w:right w:val="single" w:sz="4" w:color="D8E2E9"/><w:insideH w:val="single" w:sz="4" w:color="D8E2E9"/><w:insideV w:val="single" w:sz="4" w:color="D8E2E9"/></w:tblBorders></w:tblPr>${rows
    .map(
      ([label, content]) =>
        `<w:tr><w:tc>${paragraph(label)}</w:tc><w:tc>${content.image ? imageParagraph(relationshipId, imageId, `${label} image`) : paragraph(content.text ?? '')}</w:tc></w:tr>`,
    )
    .join('')}</w:tbl>`;
}

function createDocx(fixture: SectionFixture) {
  const body: string[] = [
    paragraph(`CUET General Test - ${fixture.sectionName}`),
    paragraph(
      `Slot: ${fixture.slotCode} | Section: ${fixture.sectionCode} | Subject: ${fixture.subjectCode}`,
    ),
    paragraph(
      'Upload this Word file together with the matching Excel mapping file.',
    ),
    paragraph(`Comprehension - ${fixture.comprehensionCode}`, 'Heading1'),
    paragraph(fixture.comprehension),
    imageParagraph('rId1', 1, `${fixture.sectionCode} comprehension diagram`),
  ];
  fixture.questions.forEach((question, index) => {
    if (index === 3) body.push(paragraph('Standalone Questions', 'Heading1'));
    body.push(
      paragraph(`Question - ${question.code}`, 'Heading2'),
      paragraph(question.text),
    );
    if (question.image)
      body.push(imageParagraph('rId2', 2, `${question.code} question diagram`));
    if (question.options?.length) {
      body.push(
        paragraph('Options', 'Heading3'),
        table(
          question.options.map((option, optionIndex) => [
            String.fromCharCode(65 + optionIndex),
            index === 0 && optionIndex === question.options!.length - 1
              ? { image: true }
              : { text: option },
          ]),
          10 + index,
        ),
      );
    }
    body.push(
      paragraph('Answer Rules', 'Heading3'),
      table(
        [
          ['Correct Option', { text: question.correctOption ?? '' }],
          [
            'Accepted Answers',
            { text: (question.acceptedAnswers ?? []).join('|') },
          ],
          [
            'Numeric Tolerance',
            {
              text:
                question.tolerance === undefined
                  ? ''
                  : String(question.tolerance),
            },
          ],
          ['Case Sensitive', { text: question.caseSensitive ? 'Yes' : 'No' }],
        ],
        20 + index,
      ),
      paragraph('Explanation', 'Heading3'),
    );
    if (index === fixture.questions.length - 1)
      body.push(
        imageParagraph('rId2', 30 + index, `${question.code} explanation`),
      );
    else body.push(paragraph(question.explanation));
  });
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body.join('')}<w:sectPr/></w:body></w:document>`;
  const styles =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:qFormat/></w:style></w:styles>';
  const relationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/comprehension.png"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/question.png"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  return zip([
    {
      name: '[Content_Types].xml',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
    },
    {
      name: '_rels/.rels',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    },
    { name: 'word/document.xml', data: document },
    { name: 'word/styles.xml', data: styles },
    { name: 'word/_rels/document.xml.rels', data: relationships },
    { name: 'word/media/comprehension.png', data: diagram(fixture.diagram, 0) },
    { name: 'word/media/question.png', data: diagram(fixture.diagram, 1) },
  ]);
}

function createExcel(fixture: SectionFixture) {
  const rows = fixture.questions.map((question, index) => ({
    question_code: question.code,
    comprehension_code: index < 3 ? fixture.comprehensionCode : '',
    slot_code: fixture.slotCode,
    section_code: fixture.sectionCode,
    subject_code: fixture.subjectCode,
    question_type_id: question.typeId,
    marks: 5,
    negative_marks: question.typeId === 1 ? 1 : 0,
    sort_order: index + 1,
    is_mandatory: true,
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(rows),
    'Question Mapping',
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      { id: 1, code: 'SINGLE_CHOICE', name: 'Single Answer' },
      { id: 2, code: 'NUMERIC', name: 'Numeric Answer' },
      { id: 3, code: 'ONE_WORD', name: 'One Word Answer' },
    ]),
    'Question Types',
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ['Template', 'CUET General Test Template'],
      ['Slot', fixture.slotCode],
      ['Section', `${fixture.sectionCode} - ${fixture.sectionName}`],
      ['Subject', fixture.subjectCode],
      ['Questions', fixture.questions.length],
      ['Paired Word file', `${fixture.fileStem}-content.docx`],
    ]),
    'Instructions',
  );
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

function fullExamFixtures(): SectionFixture[] {
  const prefixes: Record<string, string> = {
    LANGUAGE: 'CUET-FULL-ENG',
    QUANT: 'CUET-FULL-QUANT',
    REASONING: 'CUET-FULL-REA',
  };
  return fixtures.map((fixture) => ({
    ...fixture,
    comprehensionCode: `${prefixes[fixture.sectionCode]}-COMPREHENSION-001`,
    questions: fixture.questions.map((question, index) => ({
      ...question,
      code: `${prefixes[fixture.sectionCode]}-${String(index + 1).padStart(3, '0')}`,
    })),
  }));
}

function createFullExamDocx(fullFixtures: SectionFixture[]) {
  const body: string[] = [
    paragraph('CUET General Test - Complete Exam Import'),
    paragraph(
      'This single Word file contains content for every section in CUET_SLOT_1 and must be uploaded with the matching full-exam Excel file.',
    ),
  ];
  const relationships: string[] = [];
  const media: Array<{ name: string; data: Buffer }> = [];
  let drawingId = 1;

  fullFixtures.forEach((fixture, fixtureIndex) => {
    const comprehensionRelationshipId = `rId${fixtureIndex * 2 + 1}`;
    const questionRelationshipId = `rId${fixtureIndex * 2 + 2}`;
    const comprehensionImageName = `section-${fixtureIndex + 1}-comprehension.png`;
    const questionImageName = `section-${fixtureIndex + 1}-question.png`;
    relationships.push(
      `<Relationship Id="${comprehensionRelationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${comprehensionImageName}"/>`,
      `<Relationship Id="${questionRelationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${questionImageName}"/>`,
    );
    media.push(
      {
        name: `word/media/${comprehensionImageName}`,
        data: diagram(fixture.diagram, 0),
      },
      {
        name: `word/media/${questionImageName}`,
        data: diagram(fixture.diagram, 1),
      },
    );
    body.push(
      paragraph(
        `${fixture.sectionName} | Slot: ${fixture.slotCode} | Section: ${fixture.sectionCode} | Subject: ${fixture.subjectCode}`,
      ),
      paragraph(`Comprehension - ${fixture.comprehensionCode}`, 'Heading1'),
      paragraph(fixture.comprehension),
      imageParagraph(
        comprehensionRelationshipId,
        drawingId++,
        `${fixture.sectionCode} comprehension diagram`,
      ),
    );
    fixture.questions.forEach((question, questionIndex) => {
      if (questionIndex === 3)
        body.push(paragraph('Standalone Questions', 'Heading1'));
      body.push(
        paragraph(`Question - ${question.code}`, 'Heading2'),
        paragraph(question.text),
      );
      if (question.image)
        body.push(
          imageParagraph(
            questionRelationshipId,
            drawingId++,
            `${question.code} question diagram`,
          ),
        );
      if (question.options?.length)
        body.push(
          paragraph('Options', 'Heading3'),
          table(
            question.options.map((option, optionIndex) => [
              String.fromCharCode(65 + optionIndex),
              questionIndex === 0 &&
              optionIndex === question.options!.length - 1
                ? { image: true }
                : { text: option },
            ]),
            drawingId++,
            questionRelationshipId,
          ),
        );
      body.push(
        paragraph('Answer Rules', 'Heading3'),
        table(
          [
            ['Correct Option', { text: question.correctOption ?? '' }],
            [
              'Accepted Answers',
              { text: (question.acceptedAnswers ?? []).join('|') },
            ],
            [
              'Numeric Tolerance',
              {
                text:
                  question.tolerance === undefined
                    ? ''
                    : String(question.tolerance),
              },
            ],
            ['Case Sensitive', { text: question.caseSensitive ? 'Yes' : 'No' }],
          ],
          drawingId++,
          questionRelationshipId,
        ),
        paragraph('Explanation', 'Heading3'),
      );
      if (questionIndex === fixture.questions.length - 1)
        body.push(
          imageParagraph(
            questionRelationshipId,
            drawingId++,
            `${question.code} explanation`,
          ),
        );
      else body.push(paragraph(question.explanation));
    });
  });

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body.join('')}<w:sectPr/></w:body></w:document>`;
  const styles =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:qFormat/></w:style></w:styles>';
  const styleRelationshipId = `rId${fullFixtures.length * 2 + 1}`;
  const documentRelationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships.join('')}<Relationship Id="${styleRelationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  return zip([
    {
      name: '[Content_Types].xml',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
    },
    {
      name: '_rels/.rels',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    },
    { name: 'word/document.xml', data: document },
    { name: 'word/styles.xml', data: styles },
    {
      name: 'word/_rels/document.xml.rels',
      data: documentRelationships,
    },
    ...media,
  ]);
}

function createFullExamExcel(fullFixtures: SectionFixture[]) {
  const rows = fullFixtures.flatMap((fixture) =>
    fixture.questions.map((question, index) => ({
      question_code: question.code,
      comprehension_code: index < 3 ? fixture.comprehensionCode : '',
      slot_code: fixture.slotCode,
      section_code: fixture.sectionCode,
      subject_code: fixture.subjectCode,
      question_type_id: question.typeId,
      marks: 5,
      negative_marks: question.typeId === 1 ? 1 : 0,
      sort_order: index + 1,
      is_mandatory: true,
    })),
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(rows),
    'Question Mapping',
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      { id: 1, code: 'SINGLE_CHOICE', name: 'Single Answer' },
      { id: 2, code: 'NUMERIC', name: 'Numeric Answer' },
      { id: 3, code: 'ONE_WORD', name: 'One Word Answer' },
    ]),
    'Question Types',
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ['Template', 'CUET General Test Template'],
      ['Import scope', 'Full exam'],
      ['Slot', 'CUET_SLOT_1'],
      [
        'Sections',
        fullFixtures.map((fixture) => fixture.sectionCode).join(', '),
      ],
      [
        'Subjects',
        fullFixtures.map((fixture) => fixture.subjectCode).join(', '),
      ],
      ['Questions', rows.length],
      ['Paired Word file', '00-full-exam-all-sections-content.docx'],
    ]),
    'Instructions',
  );
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

async function main() {
  const outputDirectory = join(
    process.cwd(),
    'generated',
    'exam-import-fixtures',
    'cuet-general-test-v4',
  );
  await mkdir(outputDirectory, { recursive: true });
  const manifest: string[] = [
    '# CUET General Test v4 - Section Import Fixtures',
    '',
    'Use **One section** import scope. Select the named destination section and upload its matching Word + Excel pair.',
    'Word files use Heading 1/2/3 and tables; they do not use END markers. Each pair demonstrates embedded image content.',
    '',
  ];
  for (const fixture of fixtures) {
    const wordName = `${fixture.fileStem}-content.docx`;
    const excelName = `${fixture.fileStem}-mapping.xlsx`;
    await Promise.all([
      writeFile(join(outputDirectory, wordName), createDocx(fixture)),
      writeFile(join(outputDirectory, excelName), createExcel(fixture)),
    ]);
    manifest.push(
      `## ${fixture.sectionName}`,
      '',
      `- Destination: \`${fixture.slotCode} / ${fixture.sectionCode}\``,
      `- Subject: \`${fixture.subjectCode}\``,
      `- Word: \`${wordName}\``,
      `- Excel: \`${excelName}\``,
      `- Questions: ${fixture.questions.length}`,
      '',
    );
  }
  const combinedFixtures = fullExamFixtures();
  const combinedWordName = '00-full-exam-all-sections-content.docx';
  const combinedExcelName = '00-full-exam-all-sections-mapping.xlsx';
  await Promise.all([
    writeFile(
      join(outputDirectory, combinedWordName),
      createFullExamDocx(combinedFixtures),
    ),
    writeFile(
      join(outputDirectory, combinedExcelName),
      createFullExamExcel(combinedFixtures),
    ),
  ]);
  manifest.push(
    '## Complete exam - all sections',
    '',
    '- Import scope: **Full exam**',
    '- Word: `00-full-exam-all-sections-content.docx`',
    '- Excel: `00-full-exam-all-sections-mapping.xlsx`',
    '- Sections: `LANGUAGE`, `QUANT`, `REASONING`',
    '- Subjects: `ENGLISH`, `MATHEMATICS`, `REASONING`',
    '- Questions: 15 (5 per section)',
    '- Uses new `CUET-FULL-*` question codes so it can be tested after the one-section fixtures.',
    '',
  );
  await writeFile(join(outputDirectory, 'README.md'), manifest.join('\n'));
  console.log(
    `Generated ${fixtures.length * 2 + 2} files in ${outputDirectory}`,
  );
}

void main();
