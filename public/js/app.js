import Socket from "./socket.js";

const countries = [];
let currentCountryTag = "";

const socket = new Socket( 
	`ws://${location.hash != "" ? `${location.hostname}:${location.hash.replace("#", "")}` : location.host}/wss`
);

const getApplicationsForCountry = countryTag => document.getElementById("wscontent").querySelectorAll(`.${countryTag}`);

const borrowCountry = (discordId, countryTag) =>
	socket.send("countryBorrowed", { discordId: discordId, countryTag: countryTag });

const updateApplicationsForCountry = (countryTag) => {
	const count = getApplicationsForCountry(countryTag).length;
	const country = countries.find((c) => c.countryTag == countryTag);
	const picker = document.getElementById("cp").querySelector(`[value=${country.countryTag}]`);

	picker.classList.contains("hidden") && picker.classList.remove("hidden");

	picker.querySelector('.count').textContent = `(${count})`;
}

const changeCurrentCountry = countryTag => {
	currentCountryTag = countryTag;
	const picker = document.getElementById("wscontent");
	const spanCountry = document.querySelector('.main-title span');
	const countryName = countries.find(c => c.countryTag == countryTag).countryName;

	spanCountry.textContent = `(${countryName})`;
	picker.querySelectorAll(".application").forEach(country => country.classList.add("hidden"));

	getApplicationsForCountry(countryTag).forEach((country) => country.classList.remove("hidden"));
}

const createApplication = (countryTag, discordId, applicationText) => {
	socket.send("getUserInfo", { id: discordId });

	const application = document.createElement("div");
	application.classList = `${countryTag} id${discordId} application ${currentCountryTag !== countryTag ? "hidden" : ""}`;

	const application_items = document.createElement('div');
	application_items.classList = 'application_items';
	const elementPrefab = document.createElement("span");

	const countryTagElement = elementPrefab.cloneNode();
	countryTagElement.classList = 'country_tag';
	const barrowerInfo = elementPrefab.cloneNode();
	const text = elementPrefab.cloneNode();
	text.classList = 'text_why';
	const button = document.createElement("button");
	button.classList = 'application_button';

	countryTagElement.textContent = countries.find(c => c.countryTag == countryTag)?.countryName || countryTag;
	barrowerInfo.classList = "barrower";
	text.textContent = applicationText;

	button.onclick = (event) => {
		//window.open("https://sanceilaks.github.io#NXreSAXf1V8", "_blank");
		const realId = event.target.parentElement.parentElement.classList.item(1);
		const realCountryTag = event.target.parentElement.parentElement.classList.item(0);
		borrowCountry(realId ? realId.replace("id", "") : discordId, realCountryTag ? realCountryTag : countryTag);
	};
	button.textContent = 'Принять';

	application.appendChild(barrowerInfo);
	application.appendChild(application_items);
	application_items.appendChild(countryTagElement);
	application_items.appendChild(text);
	application_items.appendChild(button);

	document.querySelector("#wscontent").appendChild(application);
};

socket.addEventListener("close", ({ detail }) => console.log(detail));

document.addEventListener("DOMContentLoaded", _ => {
	document.querySelector(".start_game").onclick = _ => {
		const params = window.prompt("Айди и пароль");
		params !== null && socket.send("startGame", { content: params });
	};
	document.querySelector(".reset").onclick = _ => {
		const promtResult = window.prompt("Что сбросить? (Заявки, Страны)");
		window.confirm("Вы уверены, что хотите сбросить данные?") 
			&& socket.send("reset", { target: promtResult.toLowerCase() === "заявки" ? "applications" : "countries" });
	};

	socket.addEventListener("message", ({ detail }) => {
		const { action, data } = detail;
		switch (action) {
			case "userInfo": {
				const wscontent = document.getElementById("wscontent").querySelectorAll(`.id${data.id}`);
				wscontent.forEach(element => {
						if (element.querySelector(".barrower .avatar"))
							return;

						const img = document.createElement("img");
						img.src = data.avatarURL;
						img.classList = "avatar";
						img.onclick = _ => {
							window.open(`https://discord.com/users/${data.id}`, "_blank");
							borrowCountry();
						};

						element.querySelector(".barrower").appendChild(img);
					});
				break;
			}
			case "currentApplications": {
				document.querySelector("#wscontent").innerHTML = ""; // Mega FIX (22 approved)
				
				for (const element of data)
					data !== null && createApplication(element.countryTag, element.discordId, element.text);

				const picker = document.getElementById("cp");
				for (const country of countries) {
					const count = getApplicationsForCountry(country.countryTag).length;
					const option = document.createElement("option");
					option.value = country.countryTag;
					option.innerHTML = `<span>${country.countryName}</span> <span class="count">(${count})</span>`;
					option.classList = "country hover-underline-animation";

					count == 0 && option.classList.add("hidden");
					option.onclick = _ => {
						document.querySelector('.main-title span').textContent = `(${country.countryName})`;
						picker.querySelectorAll(".selected").forEach(option => option.classList.remove("selected"))
						option.classList.toggle("selected");
						changeCurrentCountry(option.value);
					};

					picker.appendChild(option);
				}

				changeCurrentCountry(countries[0].countryTag);
				break;
			}
			case "newApplication": {
				if (data !== null) {
					createApplication(data.countryTag, data.discordId, data.text) 
					updateApplicationsForCountry(data.countryTag);
				};

				break;
			}
			case "countryBorrow": {
				const wscontent = document.querySelector("#wscontent").querySelectorAll(`.${data.countryTag}`);
				const cp = document.querySelector("#cp");

				wscontent.forEach(el => el.remove());
				cp.querySelector(`[value="${data.countryTag}"]`).remove();
				countries.splice(countries.indexOf(countries.find(c => c.countryTag == data.countryTag)), 1);

				break;
			}
			case "countries": {
				countries.push(...data.filter(c => c.countryName != "undefined" && c.isBorrow == false));
				break;
			}
		}
	});
});