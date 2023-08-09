import Client from "./bot/client";
import { ConfigurationManager } from "./configuration";
import moment from "moment";
import { DatabaseAdapter } from "./database";
import { WebUI } from "./web/web";

const target = ["log", "warn", "error", "info"];
const originals: any[] = [];
for (const [k, v] of Object.entries(console)) {
  if (target.includes(k)) {
    originals[target.indexOf(k)] = v;
    Object.defineProperty(console, k, {
      value: (message?: any, ...optionalParams: any[]) => {
        originals[target.indexOf(k)].apply(
          console,
          [moment().format("HH:mm:ss")]
            .concat(" - ")
            .concat(message, optionalParams),
        );
      },
    });
  }
}

const database = new DatabaseAdapter();
const configuration = new ConfigurationManager("config/config.json");

Promise.all([configuration.initialize(), database.initialize()]).then(() => {
  const webui = new WebUI();
  Promise.all([webui.initialize(), webui.startServer()]);

  const client = new Client(configuration, database);
  client.start();
});
