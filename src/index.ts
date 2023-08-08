import Client from "./client";
import { ConfigurationManager } from "./configuration";
import moment from "moment";

const log = console.log;
const warn = console.warn;
const error = console.error;
const info = console.info;

console.log = (message?: any, ...optionalParams: any[]) => {
  log.apply(console, [moment().format('HH:mm:ss')].concat(" - ").concat(message, optionalParams));
};
console.warn = (message?: any, ...optionalParams: any[]) => {
  warn.apply(console, [moment().format('HH:mm:ss')].concat(" - ").concat(message, optionalParams));
}
console.error = (message?: any, ...optionalParams: any[]) => {
  error.apply(console, [moment().format('HH:mm:ss')].concat(" - ").concat(message, optionalParams));
}
console.info = (message?: any, ...optionalParams: any[]) => {
  info.apply(console, [moment().format('HH:mm:ss')].concat(" - ").concat(message, optionalParams));
}

const configuration = new ConfigurationManager("config/config.json");
configuration.initialize().then(() => {
    const client = new Client(configuration);
    client.start();
});

