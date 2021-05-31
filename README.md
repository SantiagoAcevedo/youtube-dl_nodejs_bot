# youtube-dl_nodejs_bot
Bot em NodeJS para YouTube Dl
# Comandos
Alguns comandos:
```
http://#URL#:#PORTA#/REINICIAR --> Reinicia o script (Auto Restart!)
http://#URL#:#PORTA#/LIMPAR --> Limpa downloads realziados
http://#URL#:#PORTA#/DL/:chatid/:id/:url/:formato/:modo
http://#URL#:#PORTA#/INFO/:url/:formato
```
chatid -> ID do chat (Telegram Bot)
id -> ID de identificação do Arquivo final
url -> Url do video/audio (Ver lista em https://ytdl-org.github.io/youtube-dl/supportedsites.html)
formato -> bestvideo ou bestaudio
modo -> Realizar o download por nodejs ou direto pelo youtube-dl
