export type CommandAction = {
    command: string;
    args?: any;
};
export type RegexInput = {
    regex: string,
    length: number
};

export type InputBinding = {
    input: string | RegexInput | (RegexInput | string)[],
    when?: { languages: string[] };
} & CommandAction;

