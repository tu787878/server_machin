var express = require("express");
var app = express();
var api = "/api/v1.0/";

'use strict'

const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const pcbStackup = require('pcb-stackup')
const whatsThatGerber = require('whats-that-gerber');
const writeFile = promisify(fs.writeFile)
const { validate } = require('whats-that-gerber');
const GERBERS_DIR = '';
const TOP_OUT = 'test1.svg';
const BOTTOM_OUT = 'test2.svg'; //path.join(__dirname, 'arduino-uno-bottom.svg');




var DEFAULT_COLOR = {
	// fr4: '#666',
	// cu: '#58a5e4',
	// cf: '#E5E5E5',
	// sm: '#101009', //#0F670B, #1010F5, #FB0F09, #101009, #DFE90E, #FFFFFF
	// ss: '#fff',
	// sp: '#999',
	// out: '#000',
	fr4: '#666',
	cu: '#ccc',
	cf: '#c93',
	sm: 'rgba(0, 66, 0, 0.75)',
	ss: '#fff',
	sp: '#999',
	out: '#000',
}

var GERBER_FILENAMES = [];
var typeByFilename;
//passsing directoryPath and callback function

function json2array(json){
    var result = [];
    var keys = Object.keys(json);
    keys.forEach(function(key){
        result.push(key);
    });
    return result;
}

var stackup;

app.listen(3000, () => {
	console.log("Server running on port 3000");
});

app.get(api + 'test-server', (req, res, next) => {
	res.json(["Tony", "Lisa", "Michael", "Ginger", "Food"]);
});

app.get(api + 'test-svg/:fileid', (req, res, next) => {
	//res.json(["Tony","Lisa","Michael","Ginger","Food"]);
	let fileid = req.params["fileid"];
	GERBER_FILENAMES = [];
	console.log(fileid);
	renderStackup(fileid)
		.then(writeStackup)
		.then(() => {
			res.json(
				{
					status: 1,
					message: "success",
					top: stackup.top.svg,
					bottom: stackup.bottom.svg,
					layers: stackup.layers
				}
			);
		})
		.catch(error => {
			console.error('Error rendering stackup', error);
			res.json({
				status: 0,
				message: "Wrong File name.",
				data: null
			});
		})
	//res.json(stackup.top.svg);
});

const readFilePromise = (folder) => {
	const directoryPath = path.join(__dirname, folder);
	return new Promise((resolve, reject) => {
		fs.readdir(directoryPath, function (err, files) {
			//handling error
			if (err) {
				reject("error");
				return;
			}
			//listing all files using forEach
			files.forEach(function (file) {
				// Do whatever you want to do with the file
				console.log(file);
				if (file != '.DS_Store' && file != 'PCB1 - V3.GKO') {
					GERBER_FILENAMES.push(folder + "/" + file);
				}
			});

			resolve(files);
		
		})
	})
  }

  function returnPromise(file) {
	return new Promise(function(resolve, reject) {
		readFilePromise(file).then(data => {
			const layers = GERBER_FILENAMES.map(filename => ({
				filename,
				gerber: fs.createReadStream(path.join(GERBERS_DIR, filename)),
			}))
		
			resolve(pcbStackup(layers, {
				color: DEFAULT_COLOR,
				attributes: {
					class: 'tudc',
				},
			}))
		}).catch(()=>{
			reject("error");
		})
	});
  }

function renderStackup(file) {

	return returnPromise(file);
	
}

function writeStackup(st) {
	//console.log(stackup);
	stackup = st;

}
