declare module 'mammoth/mammoth.browser.js' {
  interface MammothResult {
    value: string;
    messages: { type: string; message: string }[];
  }
  interface MammothInput {
    arrayBuffer: ArrayBuffer;
  }
  export function convertToHtml(input: MammothInput): Promise<MammothResult>;
  export function extractRawText(input: MammothInput): Promise<MammothResult>;
}
