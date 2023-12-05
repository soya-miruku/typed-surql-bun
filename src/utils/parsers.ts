export function floatJSONReplacer(key: string, value: any): any {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      return value.toString();
    }
    return parseFloat(value.toFixed(2));
  }
  return value;
}


export function extractToId(str: string) {
  const match = /:(\w+)$/.exec(str);
  return match ? match[1] : str;
}