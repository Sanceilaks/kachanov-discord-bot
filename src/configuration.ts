import fs from 'fs';

interface Dictionary<T> {
    [key: string]: T | undefined;
}

export interface Configuration extends Dictionary<string> {
    tokenEnvPath: string
}

export class ConfigurationManager {
    private configPath: string;
    private configuration?: Configuration;

    constructor(configPath: string) {
        this.configPath = configPath;
    }

    public async readConfiguration(): Promise<Configuration> {
        return JSON.parse(
            await fs.promises.readFile(this.configPath, "utf8"),
        ) as Configuration;
    }

    public async initialize(): Promise<void> {
        this.configuration = await this.readConfiguration();
        fs.watchFile(this.configPath, async () => {
            console.info("Configuration changed");
            this.configuration = await this.readConfiguration();
        })
    }
    
    public get(key: string) : string | undefined {
        return this.configuration![key];
    }
    
}