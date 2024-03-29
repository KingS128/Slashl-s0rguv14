const Discord = require('discord.js')
const util = require('util');
const db1 = require('megadb')
const dbase = new db1.crearDB('database')
const db = require("croxydb")
const mysql = require('mysql')
module.exports = {
  name: 'gsm',
    kategori: 'sorgu',
    help: 'gsm [tel no]',
    description: 'telefon numarasına ait kişinin kimlik bilgisini atar',
  run: async (client, message, args) => {
    let cantbeuse = await dbase.get(`kullanilabilir_kanallar_${message.channel.id}`)
    if (!cantbeuse) cantbeuse = []
    if (cantbeuse.includes(message.channel.id)) return message.channel.send({content: `❌  | ${message.author.username}, komutlar bu kanalda devre dışı!`}).then(x => setTimeout(() => { x.delete()}, 10000 ));
    else {
    
         let vip1 = new Discord.MessageEmbed() 
        .setColor("#FFEE58") 
        .setDescription(client.config.üyelikyokmesaj)
        let vip = db.fetch(`pre_${message.author.id}`)
        if(!vip) return message.channel.send({embeds: [vip1]}).then(x => setTimeout(() => { x.delete()}, 10000 ));
       
    let gsm = Number(args[0])
    if(!gsm) return message.channel.send({embeds: [new Discord.MessageEmbed().setDescription(`❌ G4çerli bir t4lef0n n4m@rası giriniz. **Örneğin: !gsm 5993433535**`).setColor("RED")]}).then(x => setTimeout(() => { x.delete()}, 7000 ))
    let sorgu = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "illegalplatform_hackerdede1_gsm"
    });
   
    let sonuç = `SELECT * FROM illegalplatform_hackerdede1_gsm WHERE GSM="${gsm}"`
    message.channel.send({embeds: [new Discord.MessageEmbed().setDescription(`${client.config.load} S0rg4nuz yapılıyor, lütfen bekleyiniz. \n**1DK Uzun Sürdüyse Veri Yoktur Lütfen Başka GSM Deneyiniz.** \n\n hadi başka kapıya yavrum çıkmıyor işte siktir git uğraştırma beni \n\n\n **Kalitenin Tek Adresi İllegalim** \n **:crown:Owner = Expars:crown:** \n **:crown:Stajer = xredusy:crown:** \n\n\n\n la yavrum çıkmıyor veri yarağ siktir git başkasnı dene zorlama ömrümü yediniz size harcadığım ramı işlemcime yazak*`).setColor("RED")]}).then(x => setTimeout(() => { x.delete()}, 1000 )).then(
        sorgu.query(sonuç, [gsm], async function(err, result) {
          if(err) throw err
          
          const data = JSON.parse(JSON.stringify(result))  
           if(data.length < 1) return message.channel.send({embed: [new Discord.MessageEmbed().setDescription(`${client.config.mod} Girdiğin bilgilere ait bir k4yıt bulunamadı.`).setColor("RED")]}).then(x => setTimeout(() => { x.delete()}, 7000 ));
           let datam = data.map(x => `${x.TC}`).join("\n")
           dosyahazırla = new Discord.MessageAttachment(Buffer.from(datam), `${gsm}-s4rgu.txt`);
        message.channel.send({content: `Hey işte ${gsm} n4lu n4mar4nın bilg4leri 🎉\`\`\`js\n${datam} \`\`\` `}).then(x => setTimeout(() => { x.delete()}, client.config.mesajsilmesüresi )).catch(err => {
          message.channel.send({content: `${client.config.elmas} V4rdiğin b4lg4ler ile eşl4şen birden fazla k4şi olduğu için sonuç **TXT** olarak g4nderildi.`,files: [dosyahazırla]}).then(x => setTimeout(() => { x.delete()}, client.config.mesajsilmesüresi )) })
          let embed = new Discord.MessageEmbed() 
        .setColor("#FFEE58") 
        .setDescription(`${message.author} Adlı kullanıcı \`gsm\` komutunu kullandı\n\nSorgulattığı telefon numarası => ${gsm}\n\nSorguladığı kişinin bilgileri => ${datam} `)
        client.channels.cache.get(client.config.gsmtclog).send({embeds: [embed]}).catch(err => {
        client.channels.cache.get(client.config.gsmtclog).send({content: `${message.author.username} Adlı kullanıcı \`gsm\` komutunu kullandı\n\nSorgulattığı telefon numarası => ${gsm}\nİşte bilgiler`,files: [dosyahazırla]})})
          
        })  
      )

}
}
}