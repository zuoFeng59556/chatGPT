import { Cloud } from "laf-client-sdk";

export const cloud = new Cloud({
	baseUrl: "https://<APPID>.laf.dev",
	getAccessToken: () => localStorage.getItem("access_token") as string,
	timeout: 1000000,
});


