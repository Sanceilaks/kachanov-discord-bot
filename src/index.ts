import Client from "./client";
import { ConfigurationManager } from "./configuration";
import moment from "moment";

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

const configuration = new ConfigurationManager("config/config.json");
configuration.initialize().then(() => {
  const client = new Client(configuration);
  client.start();
});
