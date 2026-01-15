import type { Plan, Task } from '@omaikit/models';
export interface CodeCommandOptions {
    planFile?: string;
    outputDir?: string;
    taskId?: string;
    force?: boolean;
}
export declare function codeCommand(options?: CodeCommandOptions): Promise<void>;
export default codeCommand;
