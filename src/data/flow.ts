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
  tag: ResultTag;
};

export type FlowNode = QuestionNode | ResultNode;

// 診断開始時の質問
export const startNodeId = "q1";

export const flow: Record<string, FlowNode> = {
  // 質問1
  q1: {
    type: "question",
    id: "q1",
    title: "上・中央？",
    choices: [
      { label: "頭）なんかある", nextId: "q2" },
      { label: "頭）曲線", nextId: "q3" },
      { label: "ぜんぶ黒", nextId: "q4" },
      { label: "足）白もある", nextId: "q5" },
    ],
  },

  // 質問2
  q2: {
    type: "question",
    id: "q2",
    title: "上・中央）右下ぜんぶ黒？",
    choices: [
      { label: "上・中央）右下ぜんぶ黒", nextId: "resultA" },
      { label: "上・中央）白もある", nextId: "resultB" },
    ],
  },

  // 質問3
  q3: {
    type: "question",
    id: "q3",
    title: "下・右？",
    choices: [
      { label: "下・右）右辺に接する", nextId: "resultC" },
      { label: "下・右）右辺に接さない", nextId: "resultD" },
      { label: "下・右）ぜんぶ黒", nextId: "resultE" },
    ],
  },

  // 質問4
  q4: {
    type: "question",
    id: "q4",
    title: "下・中央？",
    choices: [
      { label: "下・中央）爪先0", nextId: "resultF" },
      { label: "下・中央）爪先1", nextId: "resultG" },
      { label: "下・中央）爪先2", nextId: "resultH" },
    ],
  },

  // 質問5
  q5: {
    type: "question",
    id: "q5",
    title: "上・中央？",
    choices: [
      { label: "上・中央）右辺に接さない", nextId: "resultI" },
      { label: "上・中央）右辺に接する", nextId: "q6" },
    ],
  },

  // 質問6
  q6: {
    type: "question",
    id: "q6",
    title: "上・中央？",
    choices: [
      { label: "上・中央）右上ぜんぶ黒", nextId: "resultJ" },
      { label: "上・中央）右上に白もある", nextId: "resultK" },
    ],
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