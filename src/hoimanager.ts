import fs from "fs";
import gf from "graceful-fs";
import { Jomini } from "jomini";
import path from "path";
import { getDocumentsFolder } from "platform-folders";
import { getGamePath } from "steam-game-path";
import camelcaseKeysDeep from "camelcase-keys-deep";
import Yaml from "yaml";

const hoi4GameId = 394360;

namespace HoiDirectories {
	/**
	 * Retrieves the path of the HOI4 game.
	 *
	 * @return {Promise<string>} The path of the HOI4 game.
	 */
	export async function getGameHoiPath(): Promise<string> {
		return getGamePath(hoi4GameId)?.game?.path!;
	}

	/**
	 * Gets the path to the documents folder.
	 *
	 * @return {Promise<string>} The path to the documents folder.
	 */
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
	 * Retrieves an array of HoiModDescriptors by reading and parsing .mod files from the mod folder.
	 *
	 * @param {Jomini} jomini - The Jomini instance used for parsing the file content.
	 * @return {Promise<HoiModDescriptor[]>} A promise that resolves to an array of HoiModDescriptors.
	 */
	static async getDescriptors(jomini: Jomini): Promise<HoiModDescriptor[]> {
		const modFolder = path.join(await HoiDirectories.getDocumentsPath(), "mod");

		const files = await fs.promises.readdir(modFolder);
		const descriptors: HoiModDescriptor[] = await Promise.all(
			files
				.filter((file) => file.endsWith(".mod"))
				.map(async (file) => {
					const fileContent = await fs.promises.readFile(
						path.join(modFolder, file),
					);
					return HoiModDescriptor.parse(jomini, fileContent.toString());
				}),
		);

		return descriptors;
	}

	/**
	 * Parses the given content using the Jomini parser.
	 *
	 * @param {Jomini} jomini - The Jomini parser instance.
	 * @param {string} content - The content to be parsed.
	 * @return {HoiModDescriptor} The parsed HoiMod descriptor.
	 */
	static async parse(
		jomini: Jomini,
		content: string,
	): Promise<HoiModDescriptor> {
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

class DLCLoad {
	enabledMods?: string[];
	disabledDlcs?: string[];
}

export class HoiLauncherManager {
	jomini?: Jomini;

	public async initialize() {
		this.jomini = await Jomini.initialize();
	}

	/**
	 * Reads the "dlc_load.json" file from the documents path and returns the parsed data as a DLCLoad object.
	 *
	 * @return {DLCLoad} The parsed data from the "dlc_load.json" file.
	 */
	public async getDLCLoad() {
		const data = await fs.promises.readFile(
			path.join(await HoiDirectories.getDocumentsPath(), "dlc_load.json"),
		);
		return camelcaseKeysDeep(JSON.parse(data.toString())) as DLCLoad;
	}

	/**
	 * Retrieves the mods and their descriptors.
	 *
	 * @return {HoiModDescriptor[]} An array of mods descriptors.
	 */
	public async getMods() {
		const documentsPath = await HoiDirectories.getDocumentsPath();
		const mods = (await this.getDLCLoad()).enabledMods!.map((mod) => {
			const file = path.join(documentsPath, mod);
			return (
				this.jomini!.parseText(
					fs.readFileSync(file).toString(),
				) as HoiModDescriptor
			).name!;
		});

		const modsDescriptors = (
			await HoiModDescriptor.getDescriptors(this.jomini!)
		).filter((mod) => mods.includes(mod.name!));

		return modsDescriptors;
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
		const states: Record<string, any> = this.parsedSave!.states;
		let countries = new Set<string>();

		let stateNumber = 1;
		while (states[stateNumber]) {
			countries.add(states[stateNumber]["owner"]);
			stateNumber++;
		}

		return countries;
	}

	/**
	 * Retrieves the mods.
	 *
	 * @return {Promise<string[]>} The mods descriptors.
	 */
	public async getMods() {
		const mods: string[] = this.parsedSave!.mods;

		const modsDescriptors = (
			await HoiModDescriptor.getDescriptors(this.jomini!)
		).filter((mod) => mods.includes(mod.name!));

		return modsDescriptors;
	}
}

export const getCountryNameByTag = async (tag: string, manager: HoiSavesManager) => {
	console.log(`Finding country name by tag: ${tag}`);
	const localePath = path.join(
		await HoiDirectories.getGameHoiPath(),
		"localisation",
		"russian",
		"countries_l_russian.yml",
	);

	gf.gracefulify(fs);

	let fileContent = (await fs.promises.readFile(localePath)).toString();
	let result = fileContent.match(`.?${tag}:0.?\"(.+?)"`)?.at(1);
	if (result) {
		console.log(`Found in ${localePath}`);
		return result;
	}
		

	for (const mod of await manager.getMods()) {
		let modLocalePath = path.join(mod.path!, "localisation", "russian", "countries_l_russian.yml");
		if (!fs.existsSync(modLocalePath))
			modLocalePath = path.join(mod.path!, "localisation", "countries_l_russian.yml");
		if (!fs.existsSync(modLocalePath))
			modLocalePath = path.join(mod.path!, "localisation", "countries_l_english.yml");
		if (!fs.existsSync(modLocalePath))
			modLocalePath = path.join(mod.path!, "localisation", "english", "countries_l_english.yml");
		if (!fs.existsSync(modLocalePath)) {
			continue;
		}
			

		let fileContent = (await fs.promises.readFile(modLocalePath)).toString();
		let result = fileContent.match(`.?${tag}:0.?\"(.+?)"`)?.at(1);
		
		if (result) {
			console.log(`Found in ${localePath}`);
			return result;
		}

		result = fileContent.match(`.?${tag}.+?:0.?\"(.+?)"`)?.at(1);

		if (result) {
			console.log(`Found in ${modLocalePath}`);
			return result;
		}
	}

	console.log(`Cannot find localisation for ${tag}`);
};