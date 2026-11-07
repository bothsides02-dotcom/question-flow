export type Choice = {
  label: string;
  nextId: string;
};

export type QuestionNode = {
  type: "question";
  id: string;
  title: string;
  choices: Choice[];
};

// 診断結果のタグをA〜Kの11種類に拡張
export type ResultTag =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K";

export type ResultNode = {
  type: "result";
  id: string;
  title: string;
  tag?: ResultTag;
  tags?: ResultTag[];
};

export type FlowNode = QuestionNode | ResultNode;

// 診断開始時の質問
export const startNodeId = "q1";

export const flow: Record<string, FlowNode> = {
  // 質問1
  q1: {
    type: "question",
    id: "q1",
    title: "最初に上段・中央を開けてください",
    choices: [
      { label: "頭）凸部分あり", nextId: "q2" },
      { label: "頭）凸部分なし / 丸い", nextId: "q3" },
      { label: "ぜんぶ黒", nextId: "q4" },
      { label: "足）白もある", nextId: "q5" },
    ],
  },

  // 質問2
  q2: {
    type: "question",
    id: "q2",
    title: "上段・中央）このマスの右下は？",
    choices: [
      { label: "上段・中央）右下ぜんぶ黒", nextId: "resultA" },
      { label: "上段・中央）白もある", nextId: "resultB" },
	{ label: "スキップ", nextId: "skipQ2" },
    ],
  },

  // 質問3
  q3: {
    type: "question",
    id: "q3",
    title: "下段・右）シルエットは右辺に接する？",
    choices: [
      { label: "下段・右）右辺に接する", nextId: "resultC" },
      { label: "下段・右）右辺に接さない", nextId: "resultD" },
      { label: "下段・右）ぜんぶ黒", nextId: "resultE" },
	{ label: "スキップ", nextId: "skipQ3" },
    ],
  },

  // 質問4
  q4: {
    type: "question",
    id: "q4",
    title: "下段・中央）見えているつま先の数？",
    choices: [
      { label: "下段・中央）つま先0", nextId: "resultF" },
      { label: "下段・中央）つま先1", nextId: "resultG" },
      { label: "下段・中央）つま先2", nextId: "resultH" },
	{ label: "スキップ", nextId: "skipQ4" },
    ],
  },

  // 質問5
  q5: {
    type: "question",
    id: "q5",
    title: "上段・中央）シルエットは右辺に接する？",
    choices: [
      { label: "上段・中央）右辺に接さない", nextId: "resultI" },
      { label: "上段・中央）右辺に接する", nextId: "q6" },
	{ label: "スキップ", nextId: "skipQ5" },
    ],
  },

  // 質問6
  q6: {
    type: "question",
    id: "q6",
    title: "上段・中央）このマスの右上は？",
    choices: [
      { label: "上段・中央）右上ぜんぶ黒", nextId: "resultJ" },
      { label: "上段・中央）右上に白もある", nextId: "resultK" },
	{ label: "スキップ", nextId: "skipQ6" },
    ],
  },

  // スキップ専用の結果
  skipQ2: {
    type: "result",
    id: "skipQ2",
    title: "結果A - B",
    tags: ["A", "B"],
  },

  skipQ3: {
    type: "result",
    id: "skipQ3",
    title: "結果C - E",
    tags: ["C", "D", "E"],
  },

  skipQ4: {
    type: "result",
    id: "skipQ4",
    title: "結果F - H",
    tags: ["F", "G", "H"],
  },

  skipQ5: {
    type: "result",
    id: "skipQ5",
    title: "結果I - K",
    tags: ["I", "J", "K"],
  },

  skipQ6: {
    type: "result",
    id: "skipQ6",
    title: "結果J - K",
    tags: ["J", "K"],
  },

  // 診断結果A〜K
  resultA: {
    type: "result",
    id: "resultA",
    title: "結果A",
    tag: "A",
  },

  resultB: {
    type: "result",
    id: "resultB",
    title: "結果B",
    tag: "B",
  },

  resultC: {
    type: "result",
    id: "resultC",
    title: "結果C",
    tag: "C",
  },

  resultD: {
    type: "result",
    id: "resultD",
    title: "結果D",
    tag: "D",
  },

  resultE: {
    type: "result",
    id: "resultE",
    title: "結果E",
    tag: "E",
  },

  resultF: {
    type: "result",
    id: "resultF",
    title: "結果F",
    tag: "F",
  },

  resultG: {
    type: "result",
    id: "resultG",
    title: "結果G",
    tag: "G",
  },

  resultH: {
    type: "result",
    id: "resultH",
    title: "結果H",
    tag: "H",
  },

  resultI: {
    type: "result",
    id: "resultI",
    title: "結果I",
    tag: "I",
  },

  resultJ: {
    type: "result",
    id: "resultJ",
    title: "結果J",
    tag: "J",
  },

  resultK: {
    type: "result",
    id: "resultK",
    title: "結果K",
    tag: "K",
  },
};