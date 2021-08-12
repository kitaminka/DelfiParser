const Discord = require('discord.js');
const fetch = require('node-fetch');
const HTMLParser = require('node-html-parser');
const HTMLToText = require('html-to-text');
require('dotenv').config();

const webhookClient = new Discord.WebhookClient({ url: process.env.WEBHOOK_ULR });

setInterval(async () => {
    const mainPage = await fetch('https://rus.delfi.lv/news/novosti/', {
        method: 'GET'
    }).then(res => res.text());

    const mainPageHTML = HTMLParser.parse(mainPage);
    const links = mainPageHTML.querySelectorAll('div#ajax-headlines>div.row>div.mb-4>a');
    const images = mainPageHTML.querySelectorAll('.img-fluid.w-100.lazy-img.disable-lazy');

    for (let i = 3; i >= 0; i--) {
        const link = links[i];
        const image = images[i];

        const newsPage = await fetch(link.attrs.href, {
            method: 'GET'
        }).then(res => res.text());

        const newsPageHTML = HTMLParser.parse(newsPage);

        const time = newsPageHTML.querySelector('time.d-block.text-pale-sky.text-size-3.mb-2');
        const date = new Date(time.attrs.datetime);
        const now = new Date();

        if (now.valueOf() - date.valueOf() < 300000) {

            const titleText = HTMLToText.convert(image.attrs.alt, {
                wordwrap: 130
            });
            const description = newsPageHTML.querySelector('p.font-weight-bold');
            const descriptionText = HTMLToText.convert(description.innerHTML, {
                wordwrap: 130,
                selectors: [
                    {
                        selector: 'a',
                        options: {
                            ignoreHref: '*'
                        }
                    }
                ]
            }).replaceAll('\n', ' ');

            const embed = new Discord.MessageEmbed()
                .setColor('#0062ff')
                .setURL(link.attrs.href)
                .setTitle(titleText)
                .setDescription(descriptionText)
                .setImage(image.attrs.src);
            await webhookClient.send({
                embeds:[embed]
            });
        }
    }
}, 300000);