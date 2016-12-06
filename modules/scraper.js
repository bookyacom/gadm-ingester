let fs = require('fs');
let cheerio = require('cheerio');
const got = require('got');
const settings = require('../config/constant');

module.exports = scraper();

function scraper() {
	const scraper = {
		download,
		downloadZip
	};
	return scraper;
}

/*
 * Function for scraping country name from http://gadm.org/gadmcountry and passing it to download function
 */

function download() {
	return new Promise((resolve, reject) => {
		return got(settings.url)
            .then(response => {
	let $ = cheerio.load('<html><body><p><a href="http://gadm.org/gadmcountry">Country</a><br><select name="cnt"><option value="AFG_Afghanistan_3">Afghanistan</option><option value="XAD_Akrotiri and Dhekelia_2">Akrotiri and Dhekelia</option></select></p></body></html>');
	// let $ = cheerio.load(response.body);
	let countryCount = 0;
	let completedCount = 0;
	let failedCount = 0;
	$('select[name=cnt] option').each(function () {
		let optionValue = $(this).attr('value');
		let optionValueSplit = optionValue.split('_');
		countryCount++;
		downloadZip(optionValueSplit[0], optionValueSplit[1])
        .then(message => {
	settings.logger.info(message);
	completedCount++;
	if (countryCount === (completedCount + failedCount)) {
		return resolve('Completed Downloading Sucess count ' + completedCount + ' Failed Count ' + failedCount);
	}
})
        .catch(error => {
	settings.logger.info(error);
	failedCount++;
	if (countryCount === (completedCount + failedCount)) {
		return resolve('Completed Downloading Sucess count ' + completedCount + ' Failed Count ' + failedCount);
	}
});
	});
})
        .catch(error => {
	return reject(error);
});
	});
}

/*
 * Function to download shape file from http://gadm.org
 */

function downloadZip(fileName, countryName) {
	return new Promise((resolve, reject) => {
		settings.logger.info('Starting downloading ' + countryName);
		let file = fs.createWriteStream(settings.downloadPath + countryName.replace(/ /g, '_') + '.zip');
		let downloadRequest = got.stream(settings.downloadUrl.replace('XXXX', fileName)).pipe(file);
		downloadRequest.on('finish', response => {
			file.close();
			return resolve('Completed downloading ' + countryName);
		});
		downloadRequest.on('error', error => {
			file.close();
			return reject('Error on downloading ' + countryName + ' ' + error);
		});
	});
}
