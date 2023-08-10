import Socket from "./socket.js";

const countries = [];
let currentCountryTag = "";

const socket = new Socket( 
	`ws://${window.location.hash != "" ? window.location.hostname+":"+window.location.hash.replace("#", "") : window.location.host}/wss`
);

const getApplicationsForCountry = (countryTag) => {
	const picker = document.getElementById("wscontent");
	return picker.querySelectorAll(`.${countryTag}`);
}

const borrowCountry = (discordId, countryTag) => {
	socket.send("countryBorrowed", {
		discordId: discordId,
		countryTag: countryTag,
	});
};

const updateApplicationsForCountry = (countryTag) => {
	const count = getApplicationsForCountry(countryTag).length;
	const country = countries.find((c) => c.countryTag == countryTag);

	const picker = document.getElementById("cp");
	picker.querySelectorAll("[value='" + countryTag + "']").textContent = `${country.countryName} (${count})`;
}

const changeCurrentCountry = (countryTag) => {
	currentCountryTag = countryTag;
	const picker = document.getElementById("wscontent");

	picker.querySelectorAll(".application").forEach((country) => {
		country.classList.add("hidden");
	});

	getApplicationsForCountry(countryTag).forEach((country) => country.classList.remove("hidden"));
}

const createApplication = (countryTag, discordId, applicationText) => {
	socket.send("getUserInfo", {
		id: discordId,
	});

	const application = document.createElement("div");
	application.classList = `${countryTag} id${discordId} application ${currentCountryTag !== countryTag ? "hidden" : ""}`;

	const elementPrefab = document.createElement("span");

	const countryTagElement = elementPrefab.cloneNode();
	const barrowerInfo = elementPrefab.cloneNode();
	const text = elementPrefab.cloneNode();
	const button = document.createElement("button");

	countryTagElement.textContent = countries.find((c) => c.countryTag == countryTag).countryName || countryTag;
	barrowerInfo.classList = "barrower";
	text.textContent = applicationText;

	button.onclick = async () => {
		//window.open("https://sanceilaks.github.io#NXreSAXf1V8", "_blank");
		borrowCountry(discordId, countryTag);
	};
	button.textContent = "Apply";

	application.appendChild(barrowerInfo);
	application.appendChild(countryTagElement);
	application.appendChild(text);
	application.appendChild(button);

	document.querySelector("#wscontent").appendChild(application);
};

socket.addEventListener("close", ({ detail }) => console.log(detail));

document.addEventListener("DOMContentLoaded", (event) => {
	document.querySelector(".start_game").onclick = () => {
		socket.send("startGame");
	}

	document.querySelector(".reset").onclick = () => {
		socket.send("reset");
	};

	socket.addEventListener("message", ({ detail }) => {
		const { action, data } = detail;

		switch (action) {
			case "userInfo": {
				document
					.getElementById("wscontent")
					.querySelectorAll(`.id${data.id}`)
					.forEach((element) => {
						if (element.querySelector(".barrower .avatar")) return;

						const img = document.createElement("img");
						img.src = data.avatarURL;
						img.classList = "avatar";
						img.onclick = () => {
							window.open(`https://discord.com/users/${data.id}`, "_blank");
							borrowCountry();
						};

						element.querySelector(".barrower").appendChild(img);
					});
				break;
			}
			case "currentApplications": {
				for (const element of data) {
					if (data == null) return;
					createApplication(
						element.countryTag,
						element.discordId,
						element.text,
					);
				}

				const picker = document.getElementById("cp");
				for (const country of countries) {
					const option = document.createElement("option");
					option.value = country.countryTag;
					option.textContent = `${country.countryName} (${getApplicationsForCountry(country.countryTag).length})`;
					option.classList = "country hover-underline-animation";
					option.onclick = (e) => {
						picker.querySelectorAll(".selected").forEach((option) => {
							option.classList.remove("selected");
						})
						option.classList.toggle("selected");
						changeCurrentCountry(option.value);
					}
					picker.appendChild(option);
				}

				changeCurrentCountry(countries[0].countryTag);
				break;
			}
			case "newApplication": {
				if (data == null) return;
				createApplication(data.countryTag, data.discordId, data.text);
				updateApplicationsForCountry(data.countryTag);
				break;
			}
			case "countryBorrow": {
				document
					.querySelector("#wscontent")
					.querySelectorAll(`.${data.countryTag}`)
					.forEach((element) => {
						element.remove();
					});
				document.querySelector("#cp").querySelector(`[value='${data.countryTag}']`).remove();
				countries.splice(countries.indexOf(countries.find((c) => c.countryTag == data.countryTag)), 1);
				break;
			}
			case "countries": {
				countries.push(...data.filter((c) => c.countryName != "undefined"));
				break;
			}
		}
	});
});
