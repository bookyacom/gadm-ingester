/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

let cheerio = require('cheerio');
let request = require('request');
let fs = require('fs');

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
    const v = this;
    return new Promise((resolve, reject) => {
        request({
            method: 'GET',
            url: settings.url
        }, function (err, response, body) {
            if (err)
                return reject(err);
            else
            {
                let $ = cheerio.load(body);
                let countryCount = 0;
                let completedCount = 0;
                let failedCount = 0;
                $('select[name=cnt] option').each(function () {
                    let optionValue = $(this).attr('value');
                    let optionValueSplit = optionValue.split('_');
                    countryCount++;
                    v.downloadZip(optionValueSplit[0], optionValueSplit[1]).then(message => {
                        completedCount++;
                        if (countryCount == (completedCount + failedCount))
                        {
                            return resolve("Completed Downloading Sucess count " + completedCount + " Failed Count " + failedCount);
                        }
                    }).catch(err => {
                        failedCount++;
                        if (countryCount == (completedCount + failedCount))
                        {
                            return resolve("Completed Downloading Sucess count " + completedCount + " Failed Count " + failedCount);
                        }
                    })

                });
            }
        });
    });
}

/*
 * Function to download shape file from http://gadm.org
 */

function downloadZip(fileName, countryName)
{
    return new Promise((resolve, reject) => {
        logger.info("Starting downloading " + countryName);
        let downloadRequest = request(settings.downloadUrl.replace('XXXX', fileName));
        let file = fs.createWriteStream(settings.downloadPath + countryName.replace(" ", "_") + '.zip')
        downloadRequest.on('error', function (err) {
            logger.info("Error on downloading " + countryName + " " + err);
            file.close();
            return reject(err)
        });
        downloadRequest.on('end', function (err) {
            logger.info("Completed downloading " + countryName);
            file.close();
            return resolve("Completed");
        });
        downloadRequest.pipe(file);
    })
}
