const regexs:Map<string,RegExp> = new Map<string,RegExp>();

export function regexOf(regex: string): RegExp {
    if (!regexs.has(regex)) { regexs.set(regex, new RegExp(regex)); }
    return regexs.get(regex)!;
}