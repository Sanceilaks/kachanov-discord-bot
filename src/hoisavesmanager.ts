import fs from "fs";
import { Jomini } from "jomini";
import path from "path";
import { getDocumentsFolder } from "platform-folders";
import { getGamePath, getSteamPath } from "steam-game-path";

const hoi4GameId = 394360;

namespace HoiDirectories {
  export async function getGameHoiPath(): Promise<string> {
    return getGamePath(hoi4GameId)?.game?.path!;
  }

  export async function getDocumentsPath(): Promise<string> {
    return path.join(
      getDocumentsFolder(),
      "Paradox Interactive",
      "Hearts of Iron IV",
    );
  }
}

export class HoiModDescriptor {
  version?: string;
  tags?: string[];
  name?: string;
  supportedVersion?: string;
  path?: string;
  remoteFileId?: string;

  /**
   * Retrieves the descriptors from documents.
   */
  static async getDescriptors(jomini: Jomini): Promise<HoiModDescriptor[]> {
    const modFolder = path.join(await HoiDirectories.getDocumentsPath(), "mod");

    const files = await fs.promises.readdir(modFolder);
    const descriptors: HoiModDescriptor[] = [];
    for (const file of files) {
      if (!file.endsWith(".mod")) continue;
      const fileContent = await fs.promises.readFile(
        path.join(modFolder, file),
      );
      descriptors.push(
        await HoiModDescriptor.parse(jomini, fileContent.toString()),
      );
    }
    return descriptors;
  }

  static async parse(jomini: Jomini, content: string) {
    const parsed = jomini.parseText(content);
    let desc = new HoiModDescriptor();
    desc.name = parsed.name;
    desc.version = parsed.version;
    desc.tags = parsed.tags;
    desc.supportedVersion = parsed.supported_version;
    desc.path = parsed.path;
    desc.remoteFileId = parsed.remote_file_id;

    return desc;
  }
}

export class HoiSavesManager {
  jomini?: Jomini;
  parsedSave?: Record<string, any>;
  saveFile: string;

  constructor(saveFile: string) {
    this.saveFile = saveFile;
  }

  public async initialize() {
    this.jomini = await Jomini.initialize();
    this.parsedSave = await this.parseSave();
  }

  private async parseSave(): Promise<Record<string, any>> {
    const fileContent = await fs.promises.readFile(this.saveFile);
    return this.jomini!.parseText(fileContent);
  }

  public async getAvilCountries() {
    const mods = await this.getMods();
  }

  public async getMods() {
    const mods: string[] = this.parsedSave!.mods;

    const modsDescriptors = (
      await HoiModDescriptor.getDescriptors(this.jomini!)
    ).filter((mod) => mods.includes(mod.name!));

    return modsDescriptors;
  }
}
