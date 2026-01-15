import type { Plan, Task } from '@omaikit/models';
export interface TestCommandOptions {
    planFile?: string;
    outputDir?: string;
    taskId?: string;
    run?: boolean;
    force?: boolean;
    coverageTarget?: number;
}
export declare function testCommand(options?: TestCommandOptions): Promise<void>;
export default testCommand;
export {};
//# sourceMappingURL=test.d.ts.map
