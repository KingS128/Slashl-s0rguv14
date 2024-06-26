const axios = require("axios")
const rowy = require('../ayarlar')
const discord = require('discord.js')
module.exports = {
    name: "tc-sorgu",
    description: "",
    command: new discord.SlashCommandBuilder().setName("tc-sorgu").setDescription("Tc den bilgi çikartir.")
    .addStringOption(o => o.setName("tckn").setDescription("Bir TCKN belirtin.").setRequired(true)),
    usage: "",

    root: false,
    async execute(client, int, reply, log) {

    let TCKN = int.options.getString("tckn")
    if(isNaN(TCKN)) return reply("Lütfen bir T.C. Kimlik Numarası giriniz.")
    let veri = await tcSorgu(TCKN)
    //console.log(veri)

    if (veri.length > 0) {

        log(`${veri.map(x => `TCKN: ${x.TC}\nADI & SOYADI: ${x.ADI} ${x.SOYADI}\nDOĞUM TARIHI: \`${x.DOGUMTARIHI}\`\nANA ADI: ${x.ANNEADI} (\`${x.ANNETC}\`)\nBABA ADI: ${x.BABAADI} (\`${x.BABATC}\`)\nNUFUS IL: \`${x.NUFUSIL ?? "Bilinmiyor."}\`\nNUFUS ILCE: \`${x.NUFUSILCE ?? "Bilinmiyor."}\`\nUYRUK: :flag_${x?.UYRUK ? x.UYRUK.toLowerCase() : "tr"}:`)}`,`TC Sorgu Yapildi`)
    
       await int.followUp({ embeds: [new discord.EmbedBuilder().setTitle(`${veri[0].ADI} ${veri[0].SOYADI}`).setDescription(`${veri.map(x => `TCKN: ${x.TC}\nADI & SOYADI: ${x.ADI} ${x.SOYADI}\nDOĞUM TARIHI: \`${x.DOGUMTARIHI}\`\nANA ADI: ${x.ANNEADI} (\`${x.ANNETC}\`)\nBABA ADI: ${x.BABAADI} (\`${x.BABATC}\`)\nNUFUS IL: \`${x.NUFUSIL ?? "Bilinmiyor."}\`\nNUFUS ILCE: \`${x.NUFUSILCE ?? "Bilinmiyor."}\`\nUYRUK: :flag_${x?.UYRUK ? x.UYRUK.toLowerCase() : "tr"}:`)}`)]})
    } else {

        log(`Sorgulanan TC: ${TCKN}`,`TC Sorgu Basarisiz`)

       await int.followUp({ embeds: [new discord.EmbedBuilder().setTitle("Hata").setDescription("Böyle bir T.C. Kimlik Numarası bulunamadı.")]})
    }

}
}
async function tcSorgu(No) {

    let t = axios.get(`${rowy.api.TCKN}TC=${No}`).then(res => res.data)
    return t

}