var express = require('express');
var app = express();
var router = express.Router();
var util = require('util');
var VisualRecognitionV3 = require('ibm-watson/visual-recognition/v3'); //Watson APIs Node.js SDK https://github.com/watson-developer-cloud/node-sdk
var async = require('async');
var Canvas = require('canvas');
var sharp = require('sharp');
const path = require('path');
const FACE_IMAGE_MAX_SIZE = 1048576 / 2  //0.5M　 
const GENERAL_IMAGE_MAX_SIZE = 10485760; //10M

var Image = Canvas.Image;

const CLASSIFIER_ID = process.env.CLASSIFIER_ID;

//SDKでインスタンス作成, API_KEYはIBM Cloud上のCloudFoundry環境はバインドしていれば自動で環境変数から読み込み
//それ以外の環境はibm-credentials.envから読み込む。
//ibm-credentials.envはIBM CloudのVisual Recognitionサービスの管理画面からダウンロード可能。
var visualRecognition = new VisualRecognitionV3({ 
  version: '2018-03-19'
});

const fs = require("fs");
const formidable = require("formidable");

async function callVisualRecognition(filePath, baseUrl) {
    let parms = {}; 
    switch(baseUrl){ //パラメーターセット
        case '/classifyImages':
            params = {
                images_file: fs.createReadStream(filePath),
                accept_language: 'ja'
            };
            break;

        case '/classifyCustomImages':
            params = {
                images_file: fs.createReadStream(filePath),
                classifier_ids: [CLASSIFIER_ID],
                accept_language: 'ja'
            };
            break;

        case '/detectFaces':
            params = {
                images_file: fs.createReadStream(filePath),
                accept_language: 'ja'
            };
            break;
    };
    try {
        if (baseUrl == '/detectFaces'){
            const response = await visualRecognition.detectFaces(params); //SDKでVisualRecognition呼び出し
            return response;
        } else {
            const response = await visualRecognition.classify(params); //SDKでVisualRecognition呼び出し
            return response;
        }
    } catch (error) {
        throw Error(error);
    } 
  
}

async function createFaceDetectImage(response, filePath){ //顔検出画像作成
    console.log('-------new Image-------');  
    let img = new Image;
    img.src = filePath;
    console.log('-------let canvas-------');  
    let canvas = Canvas.createCanvas(img.width, img.height);
    console.log('-------let ctx-------');  
    let ctx = canvas.getContext('2d', { storage: "discardable" });
    ctx.drawImage(img, 0, 0, img.width, img.height);
    ctx.strokeStyle = "GreenYellow";
    ctx.lineWidth = "10";
    ctx.fillStyle = "GreenYellow";
    ctx.font = "100pt sans-serif";  
    response.images[0].faces.forEach( function (faceinfo, index){
        console.log('-------strokeRect------');  
        ctx.strokeRect(faceinfo.face_location.left, faceinfo.face_location.top, faceinfo.face_location.width, faceinfo.face_location.height);   
        console.log('-------fillText------');  
        ctx.fillText(index, faceinfo.face_location.left+5, faceinfo.face_location.top+faceinfo.face_location.height-5);
    });
    console.log('-------canvas.toDataURL()------');  
    response.base64img = canvas.toDataURL().split( ',' )[1];
    console.log('-------canvas.toDataURL() COMP------');  
    canvas = null;
    //ctx.clearRect(0, 0, img.width, img.height);
    ctx = null;
}

router.post('/', async function(req, res) {
    console.log(req.baseUrl);
    const form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, async function (err, fields, files) {
        if (err) {
            console.log('Error: No Parameters' + err);
            res.json({  
                errMsg: 'Error: No Parameters' + err
            });
            return;
        } else {            
            if ( !Object.keys(files).length){
                console.log('Error: No file');
                res.json({  
                    errMsg: 'Error: No file'
                });
                return;
            }
            const fileinfo = JSON.parse(JSON.stringify(files));
            console.log(fileinfo);
            
            let filePath = fileinfo.file.path;
            const sharp_image = sharp(filePath);

            if (!fileinfo.file.type.startsWith('image/')) {
                console.log("Error: Not an image file.");
                res.json({  
                    errMsg: 'Error: Not an image file.'
                });
                return;
            }
            
            const metadata = await sharp_image.metadata();
            let rotate_degree = 0;
            switch(metadata.orientation){ //顔検出画像作成の際、画像回転情報を適用する
                case 3:
                    rotate_degree = 180;
                    break;
                case 6:
                    rotate_degree = 90;
                    break;
                case 8:
                    rotate_degree = 270;
                    break;
            }

            let image_max_size = GENERAL_IMAGE_MAX_SIZE; //VisualRecognitionは最大10Mまで

            if(req.baseUrl == '/detectFaces'){
                image_max_size = FACE_IMAGE_MAX_SIZE; //顔検出画像作成の際、サイズが大きいとOut of Memoryになってしまうので顔検出の場合は最大サイズを小さめにする
            } 

            try {
                if(fileinfo.file.size > image_max_size){ //画像サイズが規定より大きい場合は縮小、VisualRecognitionは最大10Mまで                                    
                    const resize_filename = filePath + '_resize.jpg';
                    console.log(resize_filename)
                    let size = fileinfo.file.size;
                    let width = metadata.width;
                    let info = null; 
                    while (size > image_max_size){
                        console.log('-------RESIZE-------');  
                        width = Math.round(width * 0.5);
                        if (rotate_degree > 0){ //メモリー節約のため、縮小時に回転も一緒に行う
                            info = await sharp(filePath).rotate(rotate_degree).jpeg().resize(width).toFile(resize_filename);
                        } else {
                            info = await sharp(filePath).jpeg().resize(width).toFile(resize_filename);
                        }
                        size = info.size;
                        console.log(info)
                        info=null;
                    }
                    console.log('-------RESIZE COMP-------');  
                    filePath =  resize_filename;

                }
            } catch (e) {
                console.log('Error: Image resize error'+ e);
                res.json({  
                    errMsg: 'Error: Image resize error' + e
                });
                return;
            }
        
            let response = ''  ;    
            console.log('-------CLASSIFY-------');      
            try {
                response =  await callVisualRecognition(filePath, req.baseUrl);
            } catch (e) {
               // tools.setError(res,'Error: callVisualRecognition' + e );
                console.log('Error: callVisualRecognition:'+ e);
                res.json({  
                    errMsg: 'Error: callVisualRecognition' + e
                });
                return;
            } 

            if (req.baseUrl == '/detectFaces'){
                if (response.images[0].faces.length > 0 ){
                    if(fileinfo.file.size <= image_max_size && rotate_degree > 0　){ //顔検出画像作成のため、必要ならば画像回転させておく(画像が大きい場合は既に回転済)
                        console.log('-------ROTATE-------');   
                        const rotate_filename = fileinfo.file.path + '_rotate.' + path.extname(fileinfo.file.path);
                        console.log(rotate_filename);
                        try{
                            const info = await sharp(filePath).rotate(rotate_degree).toFile(rotate_filename);
                            filePath = rotate_filename;
                        } catch (e) {
                            console.log('Error: rotate image:'+ e);
                            res.json({  
                                errMsg: 'Error: rotate image' + e
                            });
                        }
                    }

                    console.log('-------createFaceDetectImage-------');  
                    createFaceDetectImage(response, filePath)//顔検出画像作成
                }
            } 
                
            res.json(response);
            return;
            
        };
    });
});

module.exports = router;