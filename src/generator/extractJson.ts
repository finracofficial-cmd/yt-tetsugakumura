/**
 * モデルの応答テキストからJSONオブジェクトを1つ取り出す。
 *
 * 構造化出力（output_config）が使えるときは応答が純粋なJSONなので不要だが、
 * APIが構造化出力を拒否したときのフォールバック経路では、モデルが
 * コードフェンスや前置きを付けてくることがある。そこで:
 *   1. ```json ... ``` のフェンスを剥がす
 *   2. 最初の { から対応する } までを、文字列リテラルを考慮して切り出す
 * の順に救済する。素のJSONならそのまま通る。
 */
export function extractJsonObject(raw: string): string {
  const text = raw.trim();

  // 1. コードフェンスを剥がす
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fence ? fence[1] : text).trim();

  if (body.startsWith("{") && body.endsWith("}")) return body;

  // 2. 最初の { から、括弧の対応が閉じるところまでを切り出す。
  //    文字列リテラル内の { } や \" を数えないよう状態を持つ。
  const start = body.indexOf("{");
  if (start < 0) throw new Error("応答にJSONオブジェクトが含まれていません。");

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < body.length; i++) {
    const ch = body[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return body.slice(start, i + 1);
    }
  }
  throw new Error("応答のJSONオブジェクトが閉じていません（出力が途中で切れた可能性）。");
}
