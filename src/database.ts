import { connect, Model, Trilogy } from "trilogy";
import { EventEmitter } from "node:events";

namespace Schemas {
	export const countryApplicatonSchema = {
		countryTag: String,
		discordId: String,
		text: String,
		time: Number,
	};

	export const countrySchema = {
		countryTag: String,
		countryName: String,
		isBorrow: Boolean,
		borrowerDiscordId: String,
	};
}

export class DatabaseAdapter extends EventEmitter {
	db: Trilogy;
	applications?: Model;
	countries?: Model;

	constructor() {
		super();
		this.db = connect("data/kachan.sqlite");
	}

	async initialize() {
		this.applications = await this.db.model(
			"applications",
			Schemas.countryApplicatonSchema,
		);
		this.countries = await this.db.model("countries", Schemas.countrySchema);

		//await this.applications.clear();
	}

	async insertApplication(countryTag: string, discordId: string, text: string) {
		if ((await this.countries?.findOne({ countryTag: countryTag }))!.isBorrow)
			return;

		await this.applications!.create({
			countryTag: countryTag,
			discordId: discordId,
			text: text,
		});
	}

	async insertCountry(countryTag: string, countryName: string) {
		if ((await this.countries!.findOne({ countryTag: countryTag })) != null)
			return;

		await this.countries!.create({
			countryTag: countryTag,
			isBorrow: false,
			countryName: countryName,
		});
	}

	async borrowCountry(countryTag: string, discordId: string) {
		const country = await this.countries?.findOne({
			countryTag: countryTag,
		});

		if (country == null) {
			throw new Error("Country not found");
		}

		await this.countries?.update(country, {
			borrowerDiscordId: discordId,
			isBorrow: true,
		});

		(await this.applications?.find({ countryTag: countryTag })!).forEach(
			(application) => {
				this.applications?.remove(application);
			},
		);

		this.emit("countryBorrow", countryTag);
	}

	async isApplicationExists(countryTag: string, discordId: string) {
		const application = await this.applications?.findOne({
			countryTag: countryTag,
			discordId: discordId,
		});

		return application != null;
	}

	async requestBorrowCountry(
		countryTag: string,
		discordId: string,
		text: string,
	) {
		const country = await this.countries?.findOne({
			countryTag: countryTag,
		});

		if (country == null) {
			throw new Error("Country not found");
		}

		if (country!.isBorrow) {
			throw new Error("Country already taken");
		}

		if (await this.isApplicationExists(countryTag, discordId)) {
			throw new Error("Application already exists");
		}

		const application = await this.applications?.create({
			countryTag: countryTag,
			discordId: discordId,
			text: text,
			time: Date.now(),
		});

		this.emit("newApplication", application!);
		return true;
	}

	async getAllApplications() {
		return await this.applications?.find({});
	}

	async getAllCountries() {
		return await this.countries?.find({});
	}

	async getAvailableCountries() {
		return await this.countries?.find({ isBorrow: false });
	}

	async getCountry(countryTag: string) {
		return await this.countries?.findOne({ countryTag: countryTag });
	}

	async getBorrowedCountries() {
		return await this.countries?.find({ isBorrow: true });
	}
}
