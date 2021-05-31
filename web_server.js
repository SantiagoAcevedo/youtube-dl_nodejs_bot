global.version = "1.1.2";
global.updated = true;
global.timeout = 25000;
version = global.version;

var ffmpeg = require('fluent-ffmpeg')
const { exec } = require("child_process");
var nodeBase64 = require('nodejs-base64-converter');
const fs = require('fs')
const youtubedl = require('youtube-dl')
var express = require('express');
var app = express();
var sID = 0;
var login = false;
var request = require('request');

var fila = []; //CRIA FILA EM ARRAY DE DOWNLOADS

function verifica_link (url){
    const options = ['--username=user', '--password=hunter2']
    youtubedl.getInfo(url, options, function(err, info) {
        if(err){
            return false;
        }else{
            if (err) throw err
            console.log('id:', info.id)
            console.log('title:', info.title)
            console.log('url:', info.url)
            console.log('thumbnail:', info.thumbnail)
            console.log('description:', info.description)
            console.log('filename:', info._filename)
            console.log('format id:', info.format_id)
            return true;
        }
    })
}
function remover_da_fila (id){
    fila.pop(id);
}
function converter(input, output, callback) {
    ffmpeg(input)
        .output(output)
        .on('end', function() {
            console.log('conversion ended');
            callback(null);
        }).on('error', function(err){
        console.log('error: ', e.code, e.msg);
        callback(err);
    }).run();
}

function alerta_telegram (chatid,msg){
    msg = encodeURI(msg);
    request('#URL_TELEGRAM_URL#/aviso_telegram.php?idchat='+chatid+'&source=dl&msg='+msg, function (error, response, body) {
        // console.log('error:', error); // Print the error if one occurred
        //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        //console.log('body:', body); // Print the HTML for the Google homepage.
    });
}

function video_info(id){
    remover_da_fila(id)
    const youtubedl = require('youtube-dl')
    const url = 'http://www.youtube.com/watch?v=WKsjaOqDXgg'
    // Optional arguments passed to youtube-dl.
    const options = ['--username=user', '--password=hunter2']
    youtubedl.getInfo(url, options, function(err, info) {
        if (err) throw err
        console.log('id:', info.id)
        console.log('title:', info.title)
        console.log('url:', info.url)
        console.log('thumbnail:', info.thumbnail)
        console.log('description:', info.description)
        console.log('filename:', info._filename)
        console.log('format id:', info.format_id)
    })
}
function video_dl(arrayid){
    var chatid = fila[0][0];
    var id = fila[0][1];
    var url = fila[0][2].toString();
    var formato = fila[0][3].toString();
    var modo = fila[0][4].toString();
    var nomearquivo = '/var/www/html/youtube/youtube-dl/'+id;

    remover_da_fila(arrayid); //remove da fila

    if(modo === 'force'){
        console.log('Forçado...');
        if(formato === 'mp3' || formato === 'bestaudio'){
            youtubedl.exec(url, ['-x', '--audio-format', 'mp3','--restrict-filenames','-o','/var/www/html/youtube/youtube-dl/'+id+'_%(title).100s-%(id)s.%(ext)s'], {}, function(err, output) {
                if(err){
                    alerta_telegram(chatid,'Opa! Não consegui baixar seu vídeo, verifique se o link é suportado!');
                    alerta_telegram(chatid,'ERRO_DEBUG ('+err.stderr+')');
                }
                if (err) throw err
                console.log(output.join('\n'))
                //alerta_telegram(chatid,'Terminei de Baixar o arquivo!');
                request('http://#URL_SERVIDOR DE DL#/youtube/fila_json.php?chat_id='+chatid+'&id='+id+'&nome=dl1', function (error, response, body) {
                    // console.log('error:', error); // Print the error if one occurred
                    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                    //console.log('body:', body); // Print the HTML for the Google homepage.
                });
               
            })
        }else{
            youtubedl.exec(url, ['--restrict-filenames','-o','/var/www/html/youtube/youtube-dl/'+id+'_%(title).100s-%(id)s.%(ext)s'], {}, function(err, output) {
                if(err){
                    alerta_telegram(chatid,'Opa! Não consegui baixar seu vídeo, verifique se o link é suportado!');
                    alerta_telegram(chatid,'ERRO_DEBUG ('+err.stderr+')');
                }
                if (err) throw err

                //console.log(output.join('\n'))
               // alerta_telegram(chatid,'Terminei de Baixar o arquivo!');

                request('http://#URL_SERVIDOR DE DL#/youtube/fila_json.php?chat_id='+chatid+'&id='+id+'&nome=dl1', function (error, response, body) {
                    // console.log('error:', error); // Print the error if one occurred
                    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                    //console.log('body:', body); // Print the HTML for the Google homepage.
                });
             
            })
        }
    }else{
        try {
        const video = youtubedl(url,['--format=best'],{ cwd: __dirname })
                // Will be called when the download starts.
                video.on('info', function(info) {
                    console.log('Iniciando Download')
                    console.log('Nome do Arquivo: ' + info._filename)
                    console.log('Tamanho: ' + info.size)
                    alerta_telegram(chatid,'Iniciando o Download do arquivo '+info._filename+' com o tamanho de '+info.size)
                })
                video.on('complete', function complete(info) {
                    'use strict'
                    console.log('filename: ' + info._filename + ' already downloaded.')
                })
                video.on('end', function() {
                    console.log('finished downloading!')
                    if(formato === 'mp3'){
                        alerta_telegram(chatid,'Terminei de baixar seu arquivo, agora vou converter!');
                        converter(nomearquivo+'.mp4', nomearquivo+'.mp3', function(err){
                            if(!err) {
                                try {
                                    fs.unlinkSync(nomearquivo+'.mp4')
                                    console.log('Arquivo apagado!');
                                } catch(err) {
                                    console.error(err)
                                }
                                console.log('conversion complete');
                                request('http://#URL_SERVIDOR DE DL#/youtube/fila_json.php?chat_id='+chatid+'&id='+id+'&nome=dl1', function (error, response, body) {                                   
                                    console.log('statusCode:', response && response.statusCode);                                    
                                });
                            }
                        });
                    }else{
                        request('http://#URL_SERVIDOR DE DL#/youtube/fila_json.php?chat_id='+chatid+'&id='+id+'&nome=dl1', function (error, response, body) {
									console.log('statusCode:', response && response.statusCode);                            
                        });
                    }

                })

                video.pipe(fs.createWriteStream(nomearquivo+'.mp4'))
        } catch (e) {
            console.log(e); // passa o objeto de exceção para o manipulador de erro
        }
    }

}
function execute(){
       if(fila.length > 0){
           console.table(fila);
           console.log(fila.length);
           //video_info(0);
           video_dl(0)
       }
}

setInterval(execute,3000);

app.use(function (req, res, next) {
    res.header("X-powered-by", "Santiago");
    res.header("X-version", version);
    res.header("Server", "Santiago");
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

    var hora = new Date().toISOString().
    replace(/T/, ' ').
        replace(/\..+/, '');
    sID++;
    sID = (sID >= 65535) ? 0 : sID;
    var ipremoto = req.header('x-forwarded-for') || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress; // Get the requestor's IP
    console.log((hora + " - " + ipremoto + ' - ' + req.url)); // Print LOG
    console.log(fila);
    next();
});

app.get('/', function (req, res) {
    res.json({
        "status": "funcionando"
    });
});
app.get('/REINICIAR', function (req, res) {
    res.json({
        "comando": "Reiniciar"
    });
    process.abort();
});
app.get('/LIMPAR', function (req, res) {
    res.json({
        "comando": "Limpando"
    });
    exec("find /var/www/html/youtube/youtube-dl/ -type f -not -name '*.php' -delete", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
});
app.get('/REMOVER/:id', function (req, res) {
    var id = req.params.id;
    remover_da_fila(id);
    res.json({
        "remover": id
    });
});
app.get('/DL/:chatid/:id/:url/:formato/:modo', function (req, res) {
    var info_dl = new Array();
    var chatid = req.params.chatid;
    var id = req.params.id;
    var formato = req.params.formato;
    var url = req.params.url;
    var modo = req.params.modo;
    chatid = chatid.toString();
    id = id.toString();
    formato = formato.toString();
    url = url.toString();
    modo = modo.toString();
        info_dl[0] = chatid;
        info_dl[1] = id;
        info_dl[2] = url;
        info_dl[3] = formato;
        info_dl[4] = modo;
    var id_array = fila.push(info_dl)
    res.json({
        "success": true,
        "datetime": Date(),
        "url": decodeURI(url),
        "formato": formato,
        "idarray": id_array,
        "acao": 'Adicionado a fila'
    });
});
app.get('/INFO/:url/:formato', function (req, res) {
    var formato = req.params.formato;
    var url = req.params.url;
    formato = formato.toString();
    url = url.toString();
    const options = ['--username=user', '--password=hunter2']
    youtubedl.getInfo(url, options, function(err, info) {

        if (err) throw err
        console.log('id:', info.id)
        console.log('title:', info.title)
        console.log('url:', info.url)
        console.log('thumbnail:', info.thumbnail)
        console.log('description:', info.description)
        console.log('filename:', info._filename)
        console.log('format id:', info.format_id)
    })
    res.json({
        "datetime": Date(),
        "id": url,
        "formato": formato,
        "id": info.id,
        "titulo": info.title
    });

});

/**
 *    Servidor na Porta 8057
 */
var serverPort = process.env.OPENSHIFT_NODEJS_PORT  || 8057;
var server = app.listen(serverPort, function () {

    console.log('');
    console.log('');
    console.log('');
    console.log('------------------------------------------------------');
    console.log('- YouTube-DL - .01                                   -');
    console.log('- Santiago Acevedo (www.santiago.ovh)                -');
    console.log('------------------------------------------------------');
    console.log('Servidor inicado... na porta %d.', server.address().port);
    console.log('');
    console.log('');
    console.log('');

});



/**
 *    Functions
 */

// TRIM
var trim = function (s) {
    var m = s.length;

    for (var i = 0; i < m && s.charCodeAt(i) < 33; i++) {}
    for (var j = m - 1; j > i && s.charCodeAt(j) < 33; j--) {}

    return s.substring(i, j + 1);
};

function injection(x) {
    var urlparse = url.parse(x);
    delete urlparse["query"];
    delete urlparse["search"];
    return url.format(urlparse);
}
