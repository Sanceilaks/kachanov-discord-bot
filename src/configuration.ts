import fs from "fs";

interface Dictionary<T> {
  [key: string]: T | undefined;
}

export interface Configuration extends Dictionary<any> {
  tokenEnvPath: string;
}

export class ServerConfiguration {
  serverId?: string;
  channelsWithoutEphemeral?: string[];
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
    });
  }

  public get<Type>(key: string): Type | undefined {
    return this.configuration![key] as Type | undefined;
  }

  public getConfigurationForServer(serverId: string): ServerConfiguration {
    return (
      this.configuration!.settingsForServers! as ServerConfiguration[]
    ).find((setting) => setting.serverId === serverId)!;
  }
}
