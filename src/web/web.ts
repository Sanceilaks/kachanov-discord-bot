import express, { Express } from "express";

export class WebUI {
    app: Express;

    constructor() {
        this.app = express();
    }

    async initialize() {
        this.app.get("/", async (req, res) => {
            res.send("Hello World!");
        })
    }

    async startServer() {
        this.app.listen(1488, () => {
            console.log(`⚡️[server]: Server is running at http://localhost:1488`);
        });
    }
}