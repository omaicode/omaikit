export interface InitCommandOptions {
    rootPath?: string;
    force?: boolean;
}
export declare function initCommand(options?: InitCommandOptions): Promise<void>;
export default initCommand;
