/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

const vorpal = require('vorpal')();
const scraper = require('./modules/scraper');
//const sqlGenerator = require('./modules/sqlGenerator');
const vorpalLog = require('vorpal-log');

/*
 * Initialising vopral to work with vorpal Logger
 */
vorpal.use(vorpalLog)
        .delimiter('gadm-ingester $')
        .show();

global.logger = vorpal.logger;

/*
 * 
 * @type Initializing settings File
 */

global.settings = require('./config/constant');

/*
 * Command for downloading shape file from gadm
 */

vorpal
        .command('download', 'Download shape file from http://gadm.org/ to download/zip folder')
        .action(function (args, callback) {
            logger.info('Starting Downloading');
            scraper.download().then(message => {
                console.log(message);
                callback();
            }).catch(err => {
                console.log(err);
                callback();
            })
        });


vorpal.
        command('sqlGenerator', 'Generate postgresql from downloaded shape file')
        .action(function (args, callback) {
            //sqlGenerator.generate();
            callback();

        });