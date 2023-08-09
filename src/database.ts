import { connect, Model, Trilogy } from "trilogy";

namespace Schemas {
  export const countryApplicatonSchema = {
    countryTag: String,
    discordId: String,
    text: String,
    time: Number
  };

  export const countrySchema = {
    countryTag: String,
    isBorrow: Boolean,
    borrowerDiscordId: String,
  };
}

export class DatabaseAdapter {
  db: Trilogy;
  applications?: Model;
  countries?: Model;

  constructor() {
    this.db = connect("data/kachan.sqlite");
  }

  async initialize() {
    this.applications = await this.db.model(
      "applications",
      Schemas.countryApplicatonSchema,
    );
    this.countries = await this.db.model("countries", Schemas.countrySchema);

    await this.applications.clear();
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

  async insertCountry(countryTag: string) {
    if ((await this.countries!.findOne({ countryTag: countryTag })) != null)
      return;

    await this.countries!.create({
      countryTag: countryTag,
      isBorrow: false,
    });
  }

  async borrowCountry(countryTag: string, discordId: string) {
    const country = await this.countries?.findOne({
      countryTag: countryTag,
    });

    if (country == null) {
        throw new Error('Country not found');
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
  }

  async isApplicationExists(countryTag: string, discordId: string) {
    const application = await this.applications?.findOne({
      countryTag: countryTag,
      discordId: discordId,
    });

    return application != null;
  }

  async requestBorrowCountry(countryTag: string, discordId: string, text: string) {
    const country = await this.countries?.findOne({
      countryTag: countryTag,
    });

    if (country == null) {
      throw new Error('Country not found');
    }

    if (country!.isBorrow) {
      throw new Error('Country already taken');
    }

    if (await this.isApplicationExists(countryTag, discordId)) {
      throw new Error('Application already exists');
    }

    await this.applications?.create({
      countryTag: countryTag,
      discordId: discordId,
      text: text,
      time: Date.now()
    });

    return true;
  }
}
