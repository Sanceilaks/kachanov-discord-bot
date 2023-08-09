import express, { Express } from "express";
import nunjucks from "nunjucks";
import { DatabaseAdapter } from "../database";

export class WebUI {
  app: Express;
  database: DatabaseAdapter;

  constructor(database: DatabaseAdapter) {
    this.database = database;
    this.app = express();

    nunjucks.configure(`public/`, {
      autoescape: true,
      express: this.app,
      noCache: true
    });
  }

  async initialize() {
    this.app.get("/", async (req, res) => {
      res.render(`index.njk`, {
        countries: await this.database.getAllCountries(),
        applications: await this.database.getAllApplications()
      });
    });

    await this.startServer();
  }

  async startServer() {
    this.app.listen(1488, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:1488`);
    });
  }
}
