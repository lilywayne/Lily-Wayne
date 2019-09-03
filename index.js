const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');
const mysql = require('./google_module/mysql');

const connection = mysql.createConnection({
    host     : process.env.mysql_host a0300871.xsph.ru ,
    user     : process.env.mysql_user a0300871_bd_other ,
    password : process.env.mysql_password GZCTH1OP,
    database : process.env.mysql_database a0300871_bd_other,
});

connection.connect(function(err){
   if (err){
        console.log(err);
        return console.log('[MYSQL] Ошибка подключения к базе MySQL');
    }
    console.log('[MYSQL] Вы успешно подключились к базе данных.')
    connection.query("SET SESSION wait_timeout = 604800"); // 3 дня
});

const events = {
    MESSAGE_REACTION_ADD: 'messageReactionAdd',
    MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};

bot.login(process.env.token);

let serverid = '618449202141331460';
let levelhigh = 0; // антиддос лвл

const sened = new Set(); // Уже отправленные запросы будут записаны в sened
const snyatie = new Set(); // Уже отправленные запросы на снятие роли быдут записаны в snyatie

let sendeddate;

const support_cooldown = new Set();
const fam_cooldown = new Set();
const ds_cooldown = new Set();
const mysql_cooldown = new Set();
const st_cd = new Set(); // Задержка между действиями
const support_settings = {
    "server_name": "Tucson", // Название сервера, будет в информации
    "support_channel": "support", // Название канала для отправки обращений
    "active-tickets": "Активные жалобы", // Категория активных жалоб
    "hold-tickets": "Жалобы на рассмотрении", // Категория жалоб на рассмотрении
    "close-tickets": "Корзина", // Категория закрытых жалоб
    "moderator": "🛡 Moderator 🛡", // Модераторы отвечающие на жалобы (по умолчанию)
    "administrators": ["★ Администратор 3 уровня ★", "★ Администратор 4 уровня ★", "Technical Support Discord"], // Дополнительные модераторы (администрация)
    "log_channel": "reports-log", // Канал для логирования действий
    "time_warning": 18000000, // Время напоминания активных жалоб (5 часов - 18000000)
    "time_deleted": 43200000, // Время удаления закрытых жалоб (24 часа - 86400000)
    "notify_moderator_channel": "moderator-chat", // Канал напоминаний для модераторов
    "notify_admin_channel": "adm-communication" // Канал напоминаний для администрации
};

let tags = require('./plugins/tags').get('tags');
let manytags = require('./plugins/tags').get('manytags');
let rolesgg = require('./plugins/tags').get('rolesgg');
let canremoverole = require('./plugins/tags').get('canremoverole');

bot.on('ready', () => {
    support_autoupdate();
    tickets_check();
    tabl_edit_update();
    console.log("Бот был успешно запущен!");
    bot.user.setPresence({ game: { name: 'Wayne Empire' }, status: 'online' })
});

bot.on('message', async message => {
    if (message.channel.type == "dm") return
    if (message.guild.id != "618449202141331460") return
    if (message.type === "PINS_ADD") if (message.channel.name == "requests-for-roles") message.delete();
    if (message.content == "/ping") return message.reply("`я онлайн!`") && console.log(`Бот ответил ${message.member.displayName}, что я онлайн.`)
    if (message.author.id == bot.user.id) return
    
    // Modules
    require('./global_systems/role').run(bot, connection, message, tags, rolesgg, canremoverole, manytags, sened, snyatie);
    // require('./global_systems/embeds').run(bot, message, setembed_general, setembed_fields, setembed_addline);
    // require('./global_systems/support').run(bot, message, support_loop, support_cooldown);
    require('./global_systems/support_new').run(bot, message, support_cooldown, connection, st_cd, support_settings);
    require('./global_systems/family').run(bot, message, connection, fam_cooldown);
    require('./global_systems/levels').run(bot, message);
    require('./global_systems/access').run(bot, message, rolesgg);

    if (message.content.startsWith(`/run`)){
        if (!message.member.hasPermission("ADMINISTRATOR") && message.author.id != '618449202141331460') return message.delete();
        const args = message.content.slice(`/run`).split(/ +/);
        let cmdrun = args.slice(1).join(" ");
        if (cmdrun.includes('process.env.token') && message.author.id != '618449202141331460'){
            message.reply(`**\`функция заблокирована в целях безопасности.\`**`);
            return message.delete();
        }
        try {
            eval(cmdrun);
        } catch (err) {
            message.reply(`**\`произошла ошибка: ${err.name} - ${err.message}\`**`);
        }
    }

    if (message.content.startsWith("/ffuser")){
        if (!message.member.hasPermission("MANAGE_ROLES") && !message.member.roles.some(r => ['★ Администратор 1 уровня ★', '★ Администратор 2 уровня ★', '★ Администратор 3 уровня ★', '★ Администратор 4 уровня ★'].includes(r.name))) return
        const args = message.content.slice('/ffuser').split(/ +/)
        if (!args[1]) return
        let name = args.slice(1).join(" ");
        let userfinders = false;
        let foundedusers_nick;
        let numberff_nick = 0;
        let max_found = 3;
        let foundedusers_tag;
        let numberff_tag = 0;
        message.guild.members.filter(userff => {
            if (userff.displayName.toLowerCase().includes(name.toLowerCase())){
                if (foundedusers_nick == null){
                    foundedusers_nick = `${numberff_nick + 1}) <@${userff.id}>`
                }else{
                    foundedusers_nick = foundedusers_nick + `\n${numberff_nick + 1}) <@${userff.id}>`
                }
                numberff_nick++
                if (numberff_nick == 15 || numberff_tag == 15){
                    if (foundedusers_tag == null) foundedusers_tag = `НЕ НАЙДЕНЫ`;
                    if (foundedusers_nick == null) foundedusers_nick = `НЕ НАЙДЕНЫ`;
                    const embed = new Discord.RichEmbed()
		            .addField(`BY NICKNAME`, foundedusers_nick, true)
                    .addField("BY DISCORD TAG", foundedusers_tag, true)
                    if (max_found > 0) message.reply(`\`по вашему запросу найдена следующая информация:\``, embed); 
                    max_found--;
                    numberff_nick = 0;
                    numberff_tag = 0;
                    foundedusers_tag = null;
                    foundedusers_nick = null;
                }
                if (!userfinders) userfinders = true;
            }else if (userff.user.tag.toLowerCase().includes(name.toLowerCase())){
                if (foundedusers_tag == null){
                    foundedusers_tag = `${numberff_tag + 1}) <@${userff.id}>`
                }else{
                    foundedusers_tag = foundedusers_tag + `\n${numberff_tag + 1}) <@${userff.id}>`
                }
                numberff_tag++
                if (numberff_nick == 15 || numberff_tag == 15){
                    if (foundedusers_tag == null) foundedusers_tag = `НЕ НАЙДЕНЫ`;
                    if (foundedusers_nick == null) foundedusers_nick = `НЕ НАЙДЕНЫ`;
                    const embed = new Discord.RichEmbed()
		            .addField(`BY NICKNAME`, foundedusers_nick, true)
                    .addField("BY DISCORD TAG", foundedusers_tag, true)
                    if (max_found > 0) message.reply(`\`по вашему запросу найдена следующая информация:\``, embed); 
                    numberff_nick = 0;
                    numberff_tag = 0;
                    foundedusers_tag = null;
                    foundedusers_nick = null;
                }
                if (!userfinders) userfinders = true;
            }
        })
        if (!userfinders) return message.reply(`я никого не нашел.`) && message.delete()
        if (numberff_nick != 0 || numberff_tag != 0){
            if (foundedusers_tag == null) foundedusers_tag = `НЕ НАЙДЕНЫ`;
            if (foundedusers_nick == null) foundedusers_nick = `НЕ НАЙДЕНЫ`;
            const embed = new Discord.RichEmbed()
	        .addField(`BY NICKNAME`, foundedusers_nick, true)
            .addField("BY DISCORD TAG", foundedusers_tag, true)
            if (max_found > 0) message.reply(`\`по вашему запросу найдена следующая информация:\``, embed); 
        }
    }
});

async function ticket_delete(){
    setInterval(async () => {
        let gserver = bot.guilds.get('618449202141331460');
        gserver.channels.forEach(async channel => {
            if (channel.name.startsWith('ticket-')){
                if (gserver.channels.find(c => c.id == channel.parentID).name == 'Корзина'){
                    let log_channel = gserver.channels.find(c => c.name == "reports-log");
                    channel.fetchMessages({limit: 1}).then(async messages => {
                        if (messages.size == 1){
                            messages.forEach(async msg => {
                                let s_now = new Date().valueOf() - 86400000;
                                if (msg.createdAt.valueOf() < s_now){
                                    let archive_messages = [];
                                    await channel.fetchMessages({limit: 100}).then(async messagestwo => {
                                        messagestwo.forEach(async msgcopy => {
                                            let date = new Date(+msgcopy.createdAt.valueOf() + 10800000);
                                            let formate_date = `[${date.getFullYear()}-` + 
                                            `${(date.getMonth() + 1).toString().padStart(2, '0')}-` +
                                            `${date.getDate().toString().padStart(2, '0')} ` + 
                                            `${date.getHours().toString().padStart(2, '0')}-` + 
                                            `${date.getMinutes().toString().padStart(2, '0')}-` + 
                                            `${date.getSeconds().toString().padStart(2, '0')}]`;
                                            if (!msgcopy.embeds[0]){
                                                archive_messages.push(`${formate_date} ${msgcopy.member.displayName}: ${msgcopy.content}`);
                                            }else{
                                                archive_messages.push(`[К СООБЩЕНИЮ БЫЛО ДОБАВЛЕНО] ${msgcopy.embeds[0].fields[1].value}`);
                                                archive_messages.push(`[К СООБЩЕНИЮ БЫЛО ДОБАВЛЕНО] ${msgcopy.embeds[0].fields[0].value}`);
                                                archive_messages.push(`${formate_date} ${msgcopy.member.displayName}: ${msgcopy.content}`);
                                            }
                                        });
                                    });
                                    let i = archive_messages.length - 1;
                                    while (i>=0){
                                        await fs.appendFileSync(`./${channel.name}.txt`, `${archive_messages[i]}\r\n`);
                                        i--
                                    }
                                    await log_channel.send(`\`[SYSTEM]\` \`Канал ${channel.name} был удален. [24 часа в статусе 'Закрыт']\``, { files: [ `./${channel.name}.txt` ] });
                                    channel.delete();
                                    fs.unlinkSync(`./${channel.name}.txt`);
                                }
                            });
                        }
                    });
                }else if(gserver.channels.find(c => c.id == channel.parentID).name == 'Активные жалобы'){
                    let log_channel = gserver.channels.find(c => c.name == "хакеры_туксона");
                    channel.fetchMessages({limit: 1}).then(messages => {
                        if (messages.size == 1){
                            messages.forEach(msg => {
                                let s_now = new Date().valueOf() - 18000000;
                                if (msg.createdAt.valueOf() < s_now){
                                    log_channel.send(`\`[SYSTEM]\` \`Жалоба\` <#${channel.id}> \`уже более 5-ти часов ожидает проверки!\``);
                                    channel.send(`\`[SYSTEM]\` \`Привет! Я напомнил модераторам про твое обращение!\``)
                                }
                            });
                        }
                    });
                }
            }
        });
    }, 60000);
}

connection.on('error', function(err) {
    if (err.code == 'PROTOCOL_CONNECTION_LOST'){
        console.log('[MYSQL] Соединение с базой MySQL потеряно. Выполняю переподключение...');
        connection.connect(function(err){
            if (err){
                return console.log('[MYSQL] Ошибка подключения к базе MySQL');
            }
            console.log('[MYSQL] Вы успешно подключились к базе данных.')
            connection.query("SET SESSION wait_timeout = 604800"); // 3 дня
        });
    }else{
        console.log('[MYSQL] Произошла ошибка MySQL, информация об ошибке: ' + err);
    }
});

function endsWithAny(suffixes, string) {
    return suffixes.some(function (suffix) {
        return string.endsWith(suffix);
    });
}

function support_autoupdate(){
    setInterval(() => {
        let server = bot.guilds.get(serverid);
        if (!server) return
        let channel = server.channels.find(c => c.name == support_settings["support_channel"]);
        if (!channel) return
        connection.query(`SELECT * FROM \`new-support\` WHERE \`server\` = '${server.id}'`, async (error, answer) => {
            if (error) return console.error(error);
            if (answer.length == 0) return
            if (answer.length == 1){
                await channel.fetchMessage(answer[0].message).then(async support_message => {
                    if (!support_message) return console.error(`При выводе support_message вылазит значение false`);
                    await connection.query(`SELECT * FROM \`tickets-new\` WHERE \`server\` = '${server.id}'`, (error, res) => {
                        if (error) return console.error(error);
                        let open = res.filter(r => r.status == 1);
                        let hold = res.filter(r => r.status == 2);
                        let close = res.filter(r => r.status == 0);
                        const image = new Discord.RichEmbed();
                        image.setImage("https://imgur.com/LKDbJeM.gif");
                        support_message.edit(`` +
                        `**Приветствую! Вы попали в канал поддержки сервера ${support_settings["server_name"]}!**\n` +
                        `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                        `**Количество вопросов за все время: ${answer[0].tickets}**\n` +
                        `**Необработанных модераторами: ${open.length}**\n` +
                        `**Вопросы на рассмотрении: ${hold.length}**\n` +
                        `**Закрытых: ${close.length}**`, image);
                    });
                }).catch(() => {
                    console.error(`Не получилось найти сообщение в support. Ошибка.`);
                });
            }else{
                return console.error(`Множество результатов в new-support.`);
            }
        });
    }, 30000);
}

function tickets_check(){
    setInterval(() => {
        let server = bot.guilds.get(serverid);
        if (!server) return console.log(`Сервер не найден [error 661]`);
        let active_tickets = server.channels.find(c => c.name == support_settings["active-tickets"]);
        let close_tickets = server.channels.find(c => c.name == support_settings["close-tickets"]);
        if (!active_tickets || !close_tickets) return console.log(`Канал тикетов не найден [error 662]`);
        connection.query(`SELECT * FROM \`tickets-new\` WHERE \`server\` = '${server.id}'`, async (error, answer) => {
            server.channels.forEach(async (ticket) => {
                if (!ticket.name.startsWith('ticket-')) return
                if (ticket.parentID == active_tickets.id){
                    ticket.fetchMessages({limit: 1}).then(messages => {
                        let message = messages.first();
                        let back_time = new Date().valueOf() - support_settings["time_warning"];
                        if (message.createdAt.valueOf() < back_time){
                            if (message.author.bot && message.content == `\`[NOTIFICATION]\` \`Ваше обращение еще в обработке! На данный момент все модераторы заняты!\``){
                                let db_ticket = answer.find(_ticket => _ticket.ticket == ticket.name.split('ticket-')[1]);
                                if (!db_ticket) return;
                                let category = server.channels.find(c => c.name == support_settings["hold-tickets"]);
                                let author = server.members.get(db_ticket.author);
                                if (!category) return 
                                if (category.children.size >= 45) return
                                connection.query(`UPDATE \`tickets-new\` SET \`status\` = '2' WHERE \`server\` = '${server.id}' AND \`ticket\` = '${ticket.name.split('ticket-')[1]}'`, async (error) => {
                                    if (error) return console.error(error);
                                    await ticket.setParent(category.id).catch((error) => {
                                        if (error) console.error(`[SUPPORT] Произошла ошибка при установки категории каналу.`);
                                        ticket.setParent(category.id);
                                    });
                                    if (author){
                                        ticket.send(`${author}, \`вашей жалобе был установлен статус: 'На рассмотрении'. Источник: Система\``);
                                    }else{
                                        ticket.send(`\`Данной жалобе [${message.channel.name}] был установлен статус: 'На рассмотрении'. Источник: Система\``);
                                    }
                                    let ticket_log = server.channels.find(c => c.name == support_settings["log_channel"]);
                                    if (ticket_log) ticket_log.send(`\`[SYSTEM]\` \`Система за долгое отсутствие ответа установила жалобе\` <#${message.channel.id}> \`[${message.channel.name}] статус 'На рассмотрении'\``);
                                });
                            }else{
                                ticket.send(`\`[NOTIFICATION]\` \`Ваше обращение еще в обработке! На данный момент все модераторы заняты!\``);
                                let db_ticket = answer.find(_ticket => _ticket.ticket == ticket.name.split('ticket-')[1]);
                                if (db_ticket.department == 0){
                                    let channel = server.channels.find(c => c.name == support_settings["notify_moderator_channel"]);
                                    let role = server.roles.find(r => r.name == support_settings["moderator"]);
                                    if (channel && role){
                                        channel.send(`\`[NOTIFICATION]\` \`Жалоба\` <#${ticket.id}> \`[${ticket.name}] активна! Пользователь ждет вашего ответа!\` ${role}`);
                                    }
                                }else if (db_ticket.department == 1){
                                    let channel = server.channels.find(c => c.name == support_settings["notify_admin_channel"]);
                                    let administrators = [];
                                    support_settings["administrators"].forEach(admin => {
                                        let role = server.roles.find(r => r.name == admin);
                                        administrators.push(`<@&${role.id}>`);
                                    });
                                    if (channel && administrators.length > 0){
                                        channel.send(`\`[NOTIFICATION]\` \`Жалоба\` <#${ticket.id}> \`[${ticket.name}] активна! Пользователь ждет вашего ответа!\` ${administrators.join(', ')}`);
                                    }
                                }
                            }
                        }
                    });
                }else if (ticket.parentID == close_tickets.id){
                    let db_ticket = answer.find(_ticket => _ticket.ticket == ticket.name.split('ticket-')[1]);
                    ticket.fetchMessages({limit: 1}).then(async messages => {
                        let message = messages.first();
                        let back_time = new Date().valueOf() - support_settings["time_deleted"];
                        if (message.createdAt.valueOf() < back_time){
                            let archive_messages = [];
                            await ticket.fetchMessages({limit: 100}).then(async messages => {
                                messages.forEach(async _message => {
                                    _message.mentions.users.forEach(mention => {
                                        let m_member = server.members.find(m => m.id == mention.id);
                                        if (m_member) _message.content = _message.content.replace(`<@!${m_member.id}>`, `${m_member.displayName || m_member.user.tag} [${m_member.id}]`).replace(`<@${m_member.id}>`, `${m_member.displayName || m_member.user.tag}`);
                                    });
                                    _message.mentions.members.forEach(mention => {
                                        let m_member = server.members.find(m => m.id == mention.id);
                                        if (m_member) _message.content = _message.content.replace(`<@!${m_member.id}>`, `${m_member.displayName || m_member.user.tag} [${m_member.id}]`).replace(`<@${m_member.id}>`, `${m_member.displayName || m_member.user.tag}`);
                                    });
                                    _message.mentions.roles.forEach(mention => {
                                        let m_role = server.roles.find(r => r.id == mention.id);
                                        if (m_role) _message.content = _message.content.replace(`<@&${m_role.id}>`, `${m_role.name}`);
                                    });
                                    let date = new Date(+_message.createdAt.valueOf() + 10800000);
                                    let formate_date = `[${date.getFullYear()}-` + 
                                    `${(date.getMonth() + 1).toString().padStart(2, '0')}-` +
                                    `${date.getDate().toString().padStart(2, '0')} ` + 
                                    `${date.getHours().toString().padStart(2, '0')}-` + 
                                    `${date.getMinutes().toString().padStart(2, '0')}-` + 
                                    `${date.getSeconds().toString().padStart(2, '0')}]`;
                                    if (!_message.embeds[0]){
                                        archive_messages.push(`${formate_date} ${_message.member.displayName || _message.member.user.tag}: ${_message.content}`);
                                    }else{
                                        archive_messages.push(`${formate_date} [К СООБЩЕНИЮ БЫЛО ДОБАВЛЕНО] ${_message.embeds[0].fields[1].value}`);
                                        archive_messages.push(`${formate_date} [К СООБЩЕНИЮ БЫЛО ДОБАВЛЕНО] ${_message.embeds[0].fields[0].value}`);
                                        archive_messages.push(`${formate_date} ${_message.member.displayName || _message.member.user.tag}: ${_message.content}`);
                                    }
                                });
                            });
                            let i = archive_messages.length - 1;
                            while (i >= 0){
                                await fs.appendFileSync(`./${ticket.name}.txt`, `${archive_messages[i]}\r\n`);
                                i--;
                            }
                            let ticket_log = server.channels.find(c => c.name == support_settings["log_channel"]);
                            let author = server.members.get(db_ticket.author);
                            if (ticket_log) await ticket_log.send(`\`[SYSTEM]\` \`Канал ${ticket.name} был удален. [24 часа в статусе 'Закрыт']\``, { files: [ `./${ticket.name}.txt` ] });
                            if (author) await author.send(`\`[SYSTEM]\` \`Здравствуйте! Ваш вопрос ${ticket.name} был удален. Все сообщения были сохранены в файл.\``, { files: [ `./${ticket.name}.txt` ] }).catch(err => { console.error('Не могу отправить сообщение пользователю тикет: ' + ticket.name) });
                            await ticket.delete();
                            fs.unlinkSync(`./${ticket.name}.txt`);
                        }
                    });
                }
            });
        });
    }, 40000);
}

bot.on('voiceStateUpdate', async (oldMember, newMember) => {
    if (oldMember.voiceChannelID == newMember.voiceChannelID) return
    if (newMember.hasPermission("ADMINISTRATOR")) return
    let member_oldchannel = await newMember.guild.channels.get(oldMember.voiceChannelID);
    let member_newchannel = await newMember.guild.channels.get(newMember.voiceChannelID);
    if (member_newchannel){
        if (member_newchannel.name == '→ Обзвон ←'){
            let edit_channel = newMember.guild.channels.find(c => c.name == "closed-accept");
            if (!edit_channel) return console.log('[ERROR] Не возможно найти текстовой канал конференции.');
            await edit_channel.overwritePermissions(newMember, {
                // GENERAL PERMISSIONS
                CREATE_INSTANT_INVITE: false,
                MANAGE_CHANNELS: false,
                MANAGE_ROLES: false,
                MANAGE_WEBHOOKS: false,
                // TEXT PERMISSIONS
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                SEND_TTS_MESSAGES: false,
                MANAGE_MESSAGES: false,
                EMBED_LINKS: true,
                ATTACH_FILES: true,
                READ_MESSAGE_HISTORY: false,
                MENTION_EVERYONE: false,
                USE_EXTERNAL_EMOJIS: false,
                ADD_REACTIONS: false,
            }, 'подключение (конференция)');
            edit_channel.send(`**<@${newMember.id}> \`успешно подключился.\`**`);
            console.log(`${newMember.displayName || newMember.user.username} подключился к обзвону.`);
        }
    }
    if (member_oldchannel){
        if (member_oldchannel.name == '→ Обзвон ←'){
        let edit_channel = newMember.guild.channels.find(c => c.name == "closed-accept");
            if (!edit_channel) return console.log('[ERROR] Не возможно найти текстовой канал конференции.');
            edit_channel.permissionOverwrites.forEach(async (perm) => {
                if (perm.type != 'member') return
                if (perm.id != newMember.id) return
                await perm.delete('отключение (конференция)');
            });
            edit_channel.send(`**<@${newMember.id}> \`отключился.\`**`);
            console.log(`${newMember.displayName || newMember.user.username} вышел с обзвона.`);
        }
    }
});

bot.on('message', async (message) => {
    if (message.channel.type == 'dm') return
    if (message.author.bot) return
    let moscow_date = new Date((new Date().valueOf()) + 10800000);
    const args = message.content.split(' ');
    if (args[0] == '/gov'){
        if (!message.member.roles.some(r => ['→ Leader`s Team ←', '→ Deputy Leader`s ←'].includes(r.name)) && !message.member.hasPermission("ADMINISTRATOR")){
            message.reply(`**\`ошибка прав доступа.\`**`).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (!args[1] || !args[2] || !args[3]){
            message.reply(`**\`использование: /gov [часы] [минуты] [фракция]\`**`);
            return message.delete();
        }
        args[2] = `${args[1]}:${args[2]}:00`;
        args[1] = `${moscow_date.getFullYear()}-${(moscow_date.getMonth() + 1).toString().padStart(2, '0')}-${moscow_date.getDate().toString().padStart(2, '0')}`;
        let date_yymmdd = args[1].split('-');
        let date_hhmmss = args[2].split(':');
        if (date_yymmdd.length != 3 || date_hhmmss.length != 3){
            message.reply(`**\`использование: /gov [часы] [минуты] [фракция]\`**`);
            return message.delete();
        }
        let date = new Date(date_yymmdd[0], date_yymmdd[1] - 1, date_yymmdd[2], date_hhmmss[0], date_hhmmss[1], date_hhmmss[2]);
        if (date.toString() == 'Invalid Date' || date.valueOf() < new Date((moscow_date) + 10800000).valueOf()){
            message.reply(`**\`использование: /gov [часы] [минуты] [фракция]\nПримечание: Дата указана не верно. ('Написано в прошлом времени')\`**`);
            return message.delete();
        }
        let formate_date = `${date.getFullYear()}-` + 
        `${(date.getMonth() + 1).toString().padStart(2, '0')}-` +
        `${date.getDate().toString().padStart(2, '0')} ` + 
        `${date.getHours().toString().padStart(2, '0')}:` + 
        `${date.getMinutes().toString().padStart(2, '0')}:` + 
        `${date.getSeconds().toString().padStart(2, '0')}`;
        let newDate = [formate_date.split(' ')[0].split('-')[0], formate_date.split(' ')[0].split('-')[1], formate_date.split(' ')[0].split('-')[2], formate_date.split(' ')[1].split(':')[0],formate_date.split(' ')[1].split(':')[1],formate_date.split(' ')[1].split(':')[2]];
        if (newDate[4] != 00 && newDate[4] != 30){
            message.reply(`**\`использование: /gov [часы] [минуты] [фракция]\nПримечание: Занимать собеседование можно в '00', '30'.\`**`);
            return message.delete();
        }
        if (!manytags.some(tag => tag == args.slice(3).join(' ').toUpperCase())){
            message.reply(`**\`использование: /gov [часы] [минуты] [фракция]\nПримечание: Организация '${args.slice(3).join(' ')}' не найдена.\`**`);
            return message.delete();
        }
        if (!message.member.roles.some(r => r.name == tags[args.slice(3).join(' ').toUpperCase()]) && !message.member.hasPermission("ADMINISTRATOR")){
            message.reply(`**\`ошибка! У вас нет прав доступа для изменения '${tags[args.slice(3).join(' ').toUpperCase()]}'\`**`);
            return message.delete();
        }
        let channel = message.guild.channels.find(c => c.name == 'gov-info');
        if (!channel) return message.reply(`**\`Канал 'gov-info' не был найден! Попросите системных модераторов создать текстовой канал.\`**`);
        channel.fetchMessages({limit: 100}).then(async messages => {
            if (messages.size <= 0){
                let fractions = ['\`Сотрудник Goverment\` ',
                '\`Сотрудник Central Bank\` ',
                '\`Сотрудник Driving School\` ',
                '\`Агент FBI\` ',
                '\`Сотрудник Los-Santos PD\` ',
                '\`Сотрудник Las-Venturas PD\` ',
                '\`Сотрудник San-Fierro PD\` ',
		'\`Сотрудник Red-County SD\` ',
                '\`Военнослужащий Los-Santos Army\` ',
                '\`Военнослужащий San-Fierro Army\` ',
                '\`Сотрудник Las-Venturas Jail\` ',
                '\`Сотрудник Los-Santos MC\` ',
                '\`Сотрудник San-Fierro MC\` ',
                '\`Сотрудник Las-Venturas MC\` ',
                '\`Сотрудник Los-Santos CNN\` ',
                '\`Сотрудник San-Fierro CNN\` ',
                '\`Сотрудник Las-Venturas CNN\` '];
                let date = ['\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`'];
                let modify = ['**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                `**\`Создана фракционная таблица организаций. Источник: Система\`**`];
                await fractions.forEach(async (string, i) => {
                    if (string.includes(tags[args.slice(3).join(' ').toUpperCase()])){
                        if (!date.some(v => v.includes(formate_date))){
                            let date_modify = new Date((moscow_date) + 10800000);
                            date[i] = '\` » ' + formate_date + '\`';
                            modify[0] = modify[1];
                            modify[1] = modify[2];
                            modify[2] = modify[3];
                            modify[3] = modify[4];
                            modify[4] = modify[5];
                            modify[5] = modify[6];
                            modify[6] = modify[7];
                            modify[7] = modify[8];
                            modify[8] = modify[9];
                            modify[9] = `**\`[${date_modify.getHours().toString().padStart(2, '0')}:${date_modify.getMinutes().toString().padStart(2, '0')}:${date_modify.getSeconds().toString().padStart(2, '0')}]\` ${message.member} \`назначил собеседование в ${args.slice(3).join(' ').toUpperCase()} на ${newDate[3]}:${newDate[4]}\`**`;
                            message.reply(`**\`вы успешно назначили собеседование в организацию '${tags[args.slice(3).join(' ').toUpperCase()]}' на ${formate_date}. Нажмите на\` <#${channel.id}> \`для просмотра.\`**`);
                            message.delete();
                        }else{
                            message.reply(`**\`собеседование на данное время уже занято! Нажмите на\` <#${channel.id}> \`для просмотра.\`**`);
                            message.delete();
                        }
                    }
                });
                const embed = new Discord.RichEmbed();
                embed.setTitle('**Arizona Role Play » Собеседования**');
                embed.setColor('#FF0000');
                embed.setTimestamp(new Date());
                embed.setFooter('Support Team » Central DataBase', message.guild.iconURL);
                embed.addField('Организация', fractions.join('\n'), true);
                embed.addField('Дата', date.join('\n'), true);
                embed.addField('Последние изменения', modify.join('\n'), false);
                channel.send(embed);
                return message.delete();
            }else if (messages.size == 1){
                messages.forEach(async msg => {
                    if (!msg.embeds) return
                    if (!msg.embeds[0].title) return
                    if (msg.embeds[0].title != '**Arizona Role Play » Собеседования**') return
                    let fractions = msg.embeds[0].fields[0].value.split('\n');
                    let date = msg.embeds[0].fields[1].value.split('\n');
                    let modify = msg.embeds[0].fields[2].value.split('\n');
                    await fractions.forEach(async (string, i) => {
                        if (string.includes(tags[args.slice(3).join(' ').toUpperCase()])){
                            if (!date.some(v => v.includes(formate_date))){
                                let date_modify = new Date((moscow_date) + 10800000);
                                date[i] = '\` » ' + formate_date + '\`';
                                modify[0] = modify[1];
                                modify[1] = modify[2];
                                modify[2] = modify[3];
                                modify[3] = modify[4];
                                modify[4] = modify[5];
                                modify[5] = modify[6];
                                modify[6] = modify[7];
                                modify[7] = modify[8];
                                modify[8] = modify[9];
                                modify[9] = `**\`[${date_modify.getHours().toString().padStart(2, '0')}:${date_modify.getMinutes().toString().padStart(2, '0')}:${date_modify.getSeconds().toString().padStart(2, '0')}]\` ${message.member} \`назначил собеседование в ${args.slice(3).join(' ').toUpperCase()} на ${newDate[3]}:${newDate[4]}\`**`;
                                message.reply(`**\`вы успешно назначили собеседование в организацию '${tags[args.slice(3).join(' ').toUpperCase()]}' на ${formate_date}. Нажмите на\` <#${channel.id}> \`для просмотра.\`**`);
                                message.delete();
                            }else{
                                message.reply(`**\`собеседование на данное время уже занято! Нажмите на\` <#${channel.id}> \`для просмотра.\`**`);
                                message.delete();
                            }
                        }
                    });
                    const embed = new Discord.RichEmbed();
                    embed.setTitle('**Arizona Role Play » Собеседования**');
                    embed.setColor('#FF0000');
                    embed.setTimestamp(new Date());
                    embed.setFooter('Support Team » Central DataBase', message.guild.iconURL);
                    embed.addField(msg.embeds[0].fields[0].name, fractions.join('\n'), msg.embeds[0].fields[0].inline);
                    embed.addField(msg.embeds[0].fields[1].name, date.join('\n'), msg.embeds[0].fields[1].inline);
                    embed.addField(msg.embeds[0].fields[2].name, modify.join('\n'), msg.embeds[0].fields[2].inline);
                    msg.edit(embed);
                });
            }else{
                message.reply(`**\`ошибка! В канале сообщений больше чем одно.\`**`);
                return message.delete();
            }
        });
    }
    if (args[0] == '/cancelgov'){
        if (!message.member.roles.some(r => ['→ Leader`s Team ←', '→ Deputy Leader`s ←'].includes(r.name)) && !message.member.hasPermission("ADMINISTRATOR")){
            message.reply(`**\`ошибка прав доступа.\`**`).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (!args[1]){
            message.reply(`**\`использование: /cancelgov [фракция]\`**`);
            return message.delete();
        }
        if (!manytags.some(tag => tag == args.slice(1).join(' ').toUpperCase())){
            message.reply(`**\`использование: /cancelgov [фракция]\nПримечание: Организация '${args.slice(3).join(' ')}' не найдена.\`**`);
            return message.delete();
        }
        if (!message.member.roles.some(r => r.name == tags[args.slice(1).join(' ').toUpperCase()]) && !message.member.hasPermission("ADMINISTRATOR")){
            message.reply(`**\`ошибка! У вас нет прав доступа для изменения '${tags[args.slice(1).join(' ').toUpperCase()]}'\`**`);
            return message.delete();
        }
        let channel = message.guild.channels.find(c => c.name == 'gov-info');
        if (!channel) return message.reply(`**\`Канал 'gov-info' не был найден! Попросите системных модераторов создать текстовой канал.\`**`);
        channel.fetchMessages({limit: 100}).then(async messages => {
            if (messages.size <= 0){
                let fractions = ['\`Сотрудник Goverment\` ',
                '\`Сотрудник Central Bank\` ',
                '\`Сотрудник Driving School\` ',
                '\`Агент FBI\` ',
                '\`Сотрудник Los-Santos PD\` ',
                '\`Сотрудник Las-Venturas PD\` ',
                '\`Сотрудник San-Fierro PD\` ',
		'\`Сотрудник Red-County SD\` ',
                '\`Военнослужащий Los-Santos Army\` ',
                '\`Военнослужащий San-Fierro Army\` ',
                '\`Сотрудник Las-Venturas Jail\` ',
                '\`Сотрудник Los-Santos MC\` ',
                '\`Сотрудник San-Fierro MC\` ',
                '\`Сотрудник Las-Venturas MC\` ',
                '\`Сотрудник Los-Santos CNN\` ',
                '\`Сотрудник San-Fierro CNN\` ',
                '\`Сотрудник Las-Venturas CNN\` '];
                let date = ['\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`'];
                let modify = ['**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                `**\`Создана фракционная таблица организаций. Источник: Система\`**`];
                const embed = new Discord.RichEmbed();
                embed.setTitle('**Arizona Role Play » Собеседования**');
                embed.setColor('#FF0000');
                embed.setTimestamp(new Date());
                embed.setFooter('Support Team » Central DataBase', message.guild.iconURL);
                embed.addField('Организация', fractions.join('\n'), true);
                embed.addField('Дата', date.join('\n'), true);
                embed.addField('Последние изменения', modify.join('\n'), false);
                channel.send(embed);
                message.reply(`**\`создана таблица по собеседованиям. Для просмотра нажмите на\` <#${channel.id}>**`);
                return message.delete();
            }else if (messages.size == 1){
                messages.forEach(async msg => {
                    if (!msg.embeds) return
                    if (!msg.embeds[0].title) return
                    if (msg.embeds[0].title != '**Arizona Role Play » Собеседования**') return
                    let fractions = msg.embeds[0].fields[0].value.split('\n');
                    let date = msg.embeds[0].fields[1].value.split('\n');
                    let modify = msg.embeds[0].fields[2].value.split('\n');
                    await fractions.forEach(async (string, i) => {
                        if (string.includes(tags[args.slice(1).join(' ').toUpperCase()])){
                            if (!date[i].includes('Не назначено')){
                                let date_modify = new Date((moscow_date) + 10800000);
                                date[i] = '\` » ' + 'Не назначено' + '\`';
                                modify[0] = modify[1];
                                modify[1] = modify[2];
                                modify[2] = modify[3];
                                modify[3] = modify[4];
                                modify[4] = modify[5];
                                modify[5] = modify[6];
                                modify[6] = modify[7];
                                modify[7] = modify[8];
                                modify[8] = modify[9];
                                modify[9] = `**\`[${date_modify.getHours().toString().padStart(2, '0')}:${date_modify.getMinutes().toString().padStart(2, '0')}:${date_modify.getSeconds().toString().padStart(2, '0')}]\` ${message.member} \`отменил собеседование в ${args.slice(1).join(' ').toUpperCase()}\`**`;
                                message.reply(`**\`вы успешно отменили собеседование в организацию '${tags[args.slice(1).join(' ').toUpperCase()]}'. Нажмите на\` <#${channel.id}> \`для просмотра.\`**`);
                                message.delete();
                            }else{
                                message.reply(`**\`собеседование в данную фракцию не назначено, зачем его отменять?! Нажмите на\` <#${channel.id}> \`для просмотра.\`**`);
                                message.delete();
                            }
                        }
                    });
                    const embed = new Discord.RichEmbed();
                    embed.setTitle('**Arizona Role Play » Собеседования**');
                    embed.setColor('#FF0000');
                    embed.setTimestamp(new Date());
                    embed.setFooter('Support Team » Central DataBase', message.guild.iconURL);
                    embed.addField(msg.embeds[0].fields[0].name, fractions.join('\n'), msg.embeds[0].fields[0].inline);
                    embed.addField(msg.embeds[0].fields[1].name, date.join('\n'), msg.embeds[0].fields[1].inline);
                    embed.addField(msg.embeds[0].fields[2].name, modify.join('\n'), msg.embeds[0].fields[2].inline);
                    msg.edit(embed);
                });
            }else{
                message.reply(`**\`ошибка! В канале сообщений больше чем одно.\`**`);
                return message.delete();
            }
        });
    }
});

async function tabl_edit_update(){
    setInterval(async () => {
        let moscow_date = new Date((new Date().valueOf()) + 10800000);
        let serverid_get = '618449202141331460';
        let channel = bot.guilds.get(serverid_get).channels.find(c => c.name == 'gov-info');
        if (!channel) return console.error('канал не найден...');
        channel.fetchMessages({limit: 100}).then(async messages => {
            if (messages.size <= 0){
                let fractions = ['\`Сотрудник Goverment\` ',
                '\`Сотрудник Central Bank\` ',
                '\`Сотрудник Driving School\` ',
                '\`Агент FBI\` ',
                '\`Сотрудник Los-Santos PD\` ',
                '\`Сотрудник Las-Venturas PD\` ',
                '\`Сотрудник San-Fierro PD\` ',
		'\`Сотрудник Red-County SD\` ',
                '\`Военнослужащий Los-Santos Army\` ',
                '\`Военнослужащий San-Fierro Army\` ',
                '\`Сотрудник Las-Venturas Jail\` ',
                '\`Сотрудник Los-Santos MC\` ',
                '\`Сотрудник San-Fierro MC\` ',
                '\`Сотрудник Las-Venturas MC\` ',
                '\`Сотрудник Los-Santos CNN\` ',
                '\`Сотрудник San-Fierro CNN\` ',
                '\`Сотрудник Las-Venturas CNN\` '];
                let date = ['\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`',
                '\` » Не назначено\`'];
                let modify = ['**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                '**Изменения не найдены! Возможно их еще не было!**',
                `**\`Создана фракционная таблица организаций. Источник: Система\`**`];
                const embed = new Discord.RichEmbed();
                embed.setTitle('**Arizona Role Play » Собеседования**');
                embed.setColor('#FF0000');
                embed.setTimestamp(new Date());
                embed.setFooter('Support Team » Central DataBase', bot.guilds.get(serverid_get).iconURL);
                embed.addField('Организация', fractions.join('\n'), true);
                embed.addField('Дата', date.join('\n'), true);
                embed.addField('Последние изменения', modify.join('\n'), false);
                channel.send(embed);
            }else if (messages.size == 1){
                messages.forEach(async msg => {
                    if (!msg.embeds) return
                    if (!msg.embeds[0].title) return
                    if (msg.embeds[0].title != '**Arizona Role Play » Собеседования**') return
                    let modify_func_get = false;
                    let fractions = msg.embeds[0].fields[0].value.split('\n');
                    let date = msg.embeds[0].fields[1].value.split('\n');
                    let modify = msg.embeds[0].fields[2].value.split('\n');
                    await date.forEach(async (string, i) => {
                        string = string.replace(' » ', '');
                        string = string.replace('\`', '');
                        string = string.replace('\`', '');
                        if (string != 'Не назначено'){
                            let date_yymmdd = string.split(' ')[0].split('-');
                            let date_hhmmss = string.split(' ')[1].split(':');
                            let newdate = await new Date(date_yymmdd[0], date_yymmdd[1] - 1, date_yymmdd[2], date_hhmmss[0], date_hhmmss[1], date_hhmmss[2]);
                            if (newdate.toString() == 'Invalid Date' || newdate.valueOf() < new Date((moscow_date) + 10800000).valueOf()){
                                let date_modify = new Date((moscow_date) + 10800000);
                                date[i] = '\` » Не назначено\`';      
                                modify[0] = modify[1];
                                modify[1] = modify[2];
                                modify[2] = modify[3];
                                modify[3] = modify[4];
                                modify[4] = modify[5];
                                modify[5] = modify[6];
                                modify[6] = modify[7];
                                modify[7] = modify[8];
                                modify[8] = modify[9];
                                modify[9] = `**\`[${date_modify.getHours().toString().padStart(2, '0')}:${date_modify.getMinutes().toString().padStart(2, '0')}:${date_modify.getSeconds().toString().padStart(2, '0')}]\` <@${bot.user.id}> \`отменил собеседование\` ${fractions[i]} \`(прошло)\`**`;
                                modify_func_get = true;
                            }
                        }
                    });
                    const embed = new Discord.RichEmbed();
                    embed.setTitle('**Arizona Role Play » Собеседования**');
                    embed.setColor('#FF0000');
                    embed.setTimestamp(new Date());
                    embed.setFooter('Support Team » Central DataBase', bot.guilds.get(serverid_get).iconURL);
                    embed.addField(msg.embeds[0].fields[0].name, fractions.join('\n'), msg.embeds[0].fields[0].inline);
                    embed.addField(msg.embeds[0].fields[1].name, date.join('\n'), msg.embeds[0].fields[1].inline);
                    embed.addField(msg.embeds[0].fields[2].name, modify.join('\n'), msg.embeds[0].fields[2].inline);
                    if (modify_func_get) msg.edit(embed);
                });
            }else{
                return console.error('канал содержит более 1 сообщения.');
            }
        });
    }, 60000);
}

bot.on('raw', async event => {
    if (!events.hasOwnProperty(event.t)) return; // Если не будет добавление или удаление смайлика, то выход
    if (event.t == "MESSAGE_REACTION_ADD"){
        let event_guildid = event.d.guild_id // ID discord сервера
        let event_channelid = event.d.channel_id // ID канала
        let event_userid = event.d.user_id // ID того кто поставил смайлик
        let event_messageid = event.d.message_id // ID сообщение куда поставлен смайлик
        let event_emoji_name = event.d.emoji.name // Название смайлика

        if (event_userid == bot.user.id) return // Если поставил смайлик бот то выход
        if (event_guildid != '618449202141331460') return // Если сервер будет другой то выход

        let server = bot.guilds.find(g => g.id == event_guildid); // Получить сервер из его ID
        let channel = server.channels.find(c => c.id == event_channelid); // Получить канал на сервере по списку каналов
        let message = await channel.fetchMessage(event_messageid); // Получить сообщение из канала
        let member = server.members.find(m => m.id == event_userid); // Получить пользователя с сервера
        
        if (channel.name != `requests-for-roles`) return // Если название канала не будет 'requests-for-roles', то выйти

        if (event_emoji_name == "🇩"){
            if (!message.embeds[0]){
                channel.send(`\`[DELETED]\` ${member} \`удалил багнутый запрос.\``);
                return message.delete();
            }else if (message.embeds[0].title == "`Discord » Проверка на валидность ник нейма.`"){
                let field_user = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[0].value.split(/ +/)[1]);
                let field_nickname = message.embeds[0].fields[1].value.split(`\`Ник:\` `)[1];
                let field_role = server.roles.find(r => "<@&" + r.id + ">" == message.embeds[0].fields[2].value.split(/ +/)[3]);
                let field_channel = server.channels.find(c => "<#" + c.id + ">" == message.embeds[0].fields[3].value.split(/ +/)[0]);
                if (!field_user || !field_nickname || !field_role || !field_channel){
                    channel.send(`\`[DELETED]\` ${member} \`удалил багнутый запрос.\``);
                }else{
                    channel.send(`\`[DELETED]\` ${member} \`удалил запрос от ${field_nickname}, с ID:\` ||**\` [${field_user.id}] \`**||`);
                }
                if (sened.has(field_nickname)) sened.delete(field_nickname); // Отметить ник, что он не отправлял запрос
                return message.delete();
            }else if (message.embeds[0].title == '`Discord » Запрос о снятии роли.`'){
                let field_author = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[0].value.split(/ +/)[1]);
                let field_user = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[1].value.split(/ +/)[1]);
                let field_role = server.roles.find(r => "<@&" + r.id + ">" == message.embeds[0].fields[2].value.split(/ +/)[3]);
                let field_channel = server.channels.find(c => "<#" + c.id + ">" == message.embeds[0].fields[3].value.split(/ +/)[0]);
                if (!field_author || !field_user || !field_role || !field_channel){
                    channel.send(`\`[DELETED]\` ${member} \`удалил багнутый запрос на снятие роли.\``);
                }else{
                    channel.send(`\`[DELETED]\` ${member} \`удалил запрос на снятие роли от ${field_author.displayName}, с ID:\` ||**\` [${field_author.id}] \`**||`);
                }
                if (snyatie.has(field_author.id + `=>` + field_user.id)) snyatie.delete(field_author.id + `=>` + field_user.id)
                return message.delete();
            }
        }else if(event_emoji_name == "❌"){
            if (message.embeds[0].title == '`Discord » Проверка на валидность ник нейма.`'){
                if (message.reactions.size != 3){
                    return channel.send(`\`[ERROR]\` \`Не торопись! Сообщение еще загружается!\``)
                }
                let date_debug = new Date().valueOf() - message.createdTimestamp;
                let field_user = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[0].value.split(/ +/)[1]);
                let field_nickname = message.embeds[0].fields[1].value.split(`\`Ник:\` `)[1];
                let field_role = server.roles.find(r => "<@&" + r.id + ">" == message.embeds[0].fields[2].value.split(/ +/)[3]);
                let field_channel = server.channels.find(c => "<#" + c.id + ">" == message.embeds[0].fields[3].value.split(/ +/)[0]);
                channel.send(`\`[DENY]\` <@${member.id}> \`отклонил запрос от ${field_nickname}, с ID:\` ||**\` [${field_user.id}] \`**||\n\`[DEBUG]\` \`Запрос был рассмотрен и отказан за ${time(date_debug)}\``);
                field_channel.send(`<@${field_user.id}>**,** \`модератор\` <@${member.id}> \`отклонил ваш запрос на выдачу роли.\nВаш ник при отправке: ${field_nickname}\nУстановите ник на: [Фракция] Имя_Фамилия [Ранг]\``)
                let date = require('./objects/functions').getDateMySQL();
                connection.query(`SELECT * FROM \`blacklist_names\` WHERE \`name\` = '${field_nickname.toLowerCase()}' AND \`server\` = '${server.id}'`, async (err, names) => {
                    if (names.length == 0) await connection.query(`INSERT INTO \`blacklist_names\` (\`server\`, \`name\`, \`blacklisted\`, \`moderator\`, \`time_add\`, \`user\`) VALUES ('${server.id}', '${field_nickname.toLowerCase()}', '1', '${member.id}', '${date}', '${field_user.id}')`);
                    if (names.length == 1){
                        connection.query(`UPDATE \`blacklist_names\` SET \`blacklisted\` = '1', \`moderator\` = '${member.id}', \`time_add\` = '${date}' WHERE \`server\` = '${server.id}' AND \`name\` = '${field_nickname.toLowerCase()}'`);
                    }
                });
                connection.query(`SELECT * FROM \`requests-for-roles\` WHERE \`server\` = '${server.id}' AND \`user\` = '${field_user.id}'`, async (err, users) => {
                    if (users.length == 0) await connection.query(`INSERT INTO \`requests-for-roles\` (\`server\`, \`user\`, \`blacklisted\`) VALUES ('${server.id}', '${field_user.id}', '${date}')`);
                    if (users.length == 1){
                        connection.query(`UPDATE \`requests-for-roles\` SET \`blacklisted\` = '${date}' WHERE \`server\` = '${server.id}' AND \`user\` = '${field_user.id}'`);
                    }
                });
                if (sened.has(field_nickname)) sened.delete(field_nickname); // Отметить ник, что он не отправлял запрос
                return message.delete();
            }else if (message.embeds[0].title == '`Discord » Запрос о снятии роли.`'){
                if (message.reactions.size != 3){
                    return channel.send(`\`[ERROR]\` \`Не торопись! Сообщение еще загружается!\``)
                }
                let date_debug = new Date().valueOf() - message.createdTimestamp;
                let field_author = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[0].value.split(/ +/)[1]);
                let field_user = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[1].value.split(/ +/)[1]);
                let field_role = server.roles.find(r => "<@&" + r.id + ">" == message.embeds[0].fields[2].value.split(/ +/)[3]);
                let field_channel = server.channels.find(c => "<#" + c.id + ">" == message.embeds[0].fields[3].value.split(/ +/)[0]);
                if (member.id == field_author.id) return channel.send(`\`[ERROR]\` \`${member.displayName} свои запросы отклонять нельзя!\``).then(msg => msg.delete(5000))
                if (!field_user.roles.some(r => r.id == field_role.id)){
                    if (snyatie.has(field_author.id + `=>` + field_user.id)) snyatie.delete(field_author.id + `=>` + field_user.id)
                    return message.delete();
                }
                channel.send(`\`[DENY]\` <@${member.id}> \`отклонил запрос на снятие роли от\` <@${field_author.id}>\`, с ID:\` ||**\` [${field_author.id}] \`**||\n\`[DEBUG]\` \`Запрос был рассмотрен и отказан за ${time(date_debug)}\``);
                field_channel.send(`<@${field_author.id}>**,** \`модератор\` <@${member.id}> \`отклонил ваш запрос на снятие роли пользователю:\` <@${field_user.id}>`)
                if (snyatie.has(field_author.id + `=>` + field_user.id)) snyatie.delete(field_author.id + `=>` + field_user.id)
                return message.delete();
            }
        }else if (event_emoji_name == "✔"){
            if (message.embeds[0].title == '`Discord » Проверка на валидность ник нейма.`'){
                if (message.reactions.size != 3){
                    return channel.send(`\`[ERROR]\` \`Не торопись! Сообщение еще загружается!\``)
                }
                let date_debug = new Date().valueOf() - message.createdTimestamp;
                let field_user = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[0].value.split(/ +/)[1]);
                let field_nickname = message.embeds[0].fields[1].value.split(`\`Ник:\` `)[1];
                let field_role = server.roles.find(r => "<@&" + r.id + ">" == message.embeds[0].fields[2].value.split(/ +/)[3]);
                let field_channel = server.channels.find(c => "<#" + c.id + ">" == message.embeds[0].fields[3].value.split(/ +/)[0]);
                if (field_user.roles.some(r => field_role.id == r.id)){
                    if (sened.has(field_nickname)) sened.delete(field_nickname); // Отметить ник, что он не отправлял запрос
                    return message.delete(); // Если роль есть, то выход
                }
                let rolesremoved = false;
                let rolesremovedcount = 0;
                if (field_user.roles.some(r=>rolesgg.includes(r.name))) {
                    for (var i in rolesgg){
                        let rolerem = server.roles.find(r => r.name == rolesgg[i]);
                        if (field_user.roles.some(role=>[rolesgg[i]].includes(role.name))){
                            rolesremoved = true;
                            rolesremovedcount = rolesremovedcount+1;
                            await field_user.removeRole(rolerem); // Забрать фракционные роли
                        }
                    }
                }
                await field_user.addRole(field_role); // Выдать роль по соответствию с тэгом
                let effects = [];
                if (field_user.roles.some(r => r.name == '🏆 Legendary 🏆')) effects.push('Legendary');
                connection.query(`SELECT * FROM \`requests-for-roles\` WHERE \`server\` = '${server.id}' AND \`user\` = '${field_user.id}'`, async (err, users) => {
                    if (users.length == 1){
                        if (new Date(`${users[0].blacklisted}`).valueOf() != '-30610224000000') effects.push('BlackListed');
                        if (new Date(`${users[0].remove_role}`).valueOf() != '-30610224000000') effects.push('Lifting the Role');
                    }
                    channel.send(`\`[ACCEPT]\` <@${member.id}> \`одобрил запрос от ${field_nickname}, с ID:\` ||**\` [${field_user.id}] \`**||\n\`[DEBUG]\` \`Запрос был рассмотрен и одобрен за ${time(date_debug)}. [${effects.join(', ') || 'None'}]\``);
                });
                if (rolesremoved){
                    if (rolesremovedcount == 1){
                        field_channel.send(`<@${field_user.id}>**,** \`модератор\` <@${member.id}> \`одобрил ваш запрос на выдачу роли.\`\n\`Роль\`  <@&${field_role.id}>  \`была выдана! ${rolesremovedcount} роль другой фракции была убрана.\``)
                    }else if (rolesremovedcount < 5){
                        field_channel.send(`<@${field_user.id}>**,** \`модератор\` <@${member.id}> \`одобрил ваш запрос на выдачу роли.\`\n\`Роль\`  <@&${field_role.id}>  \`была выдана! Остальные ${rolesremovedcount} роли других фракций были убраны.\``)
                    }else{
                        field_channel.send(`<@${field_user.id}>**,** \`модератор\` <@${member.id}> \`одобрил ваш запрос на выдачу роли.\`\n\`Роль\`  <@&${field_role.id}>  \`была выдана! Остальные ${rolesremovedcount} ролей других фракций были убраны.\``)
                    }
                }else{
                    field_channel.send(`<@${field_user.id}>**,** \`модератор\` <@${member.id}> \`одобрил ваш запрос на выдачу роли.\`\n\`Роль\`  <@&${field_role.id}>  \`была выдана!\``)
                }
                if (sened.has(field_nickname)) sened.delete(field_nickname); // Отметить ник, что он не отправлял запрос
                return message.delete();
            }else if (message.embeds[0].title == '`Discord » Запрос о снятии роли.`'){
                if (message.reactions.size != 3){
                    return channel.send(`\`[ERROR]\` \`Не торопись! Сообщение еще загружается!\``)
                }
                let date_debug = new Date().valueOf() - message.createdTimestamp;
                let field_author = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[0].value.split(/ +/)[1]);
                let field_user = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[1].value.split(/ +/)[1]);
                let field_role = server.roles.find(r => "<@&" + r.id + ">" == message.embeds[0].fields[2].value.split(/ +/)[3]);
                let field_channel = server.channels.find(c => "<#" + c.id + ">" == message.embeds[0].fields[3].value.split(/ +/)[0]);
                if (member.id == field_author.id) return channel.send(`\`[ERROR]\` \`${member.displayName} свои запросы принимать нельзя!\``).then(msg => msg.delete(5000))
                if (!field_user.roles.some(r => r.id == field_role.id)){
                    if (snyatie.has(field_author.id + `=>` + field_user.id)) snyatie.delete(field_author.id + `=>` + field_user.id)
                    return message.delete();
                }
                field_user.removeRole(field_role);
                channel.send(`\`[ACCEPT]\` <@${member.id}> \`одобрил снятие роли (${field_role.name}) от\` <@${field_author.id}>, \`пользователю\` <@${field_user.id}>, \`с ID:\` ||**\` [${field_user.id}] \`**||\n\`[DEBUG]\` \`Запрос был рассмотрен и одобрен за ${time(date_debug)}\``);
                field_channel.send(`**<@${field_user.id}>, с вас сняли роль**  <@&${field_role.id}>  **по запросу от <@${field_author.id}>.**`)
                if (snyatie.has(field_author.id + `=>` + field_user.id)) snyatie.delete(field_author.id + `=>` + field_user.id)
                let date = require('./objects/functions').getDateMySQL();
                connection.query(`SELECT * FROM \`requests-for-roles\` WHERE \`server\` = '${server.id}' AND \`user\` = '${field_user.id}'`, async (err, users) => {
                    if (users.length == 0) await connection.query(`INSERT INTO \`requests-for-roles\` (\`server\`, \`user\`, \`remove_role\`, \`staff\`) VALUES ('${server.id}', '${field_user.id}', '${date}', '${field_author.id}')`);
                    if (users.length == 1){
                        connection.query(`UPDATE \`requests-for-roles\` SET \`remove_role\` = '${date}', \`staff\` = '${field_author.id}' WHERE \`server\` = '${server.id}' AND \`user\` = '${field_user.id}'`);
                    }
                });
                return message.delete()
            }
        }
    }
});

function time(s) {
    let ms = s % 1000;
    s = (s - ms) / 1000;
    let secs = s % 60;
    s = (s - secs) / 60;
    let mins = s % 60;
    s = (s - mins) / 60;
    let hrs = s % 24;
    s = (s - hrs) / 24;
    let days = s;
    let status = true;
    let output = '';

    if (days != 0){
        if (days.toString().endsWith('1') && !days.toString().endsWith('11')){
            output += days + ' день';
        }else if (endsWithAny(['2', '3', '4'], days.toString()) && !endsWithAny(['12', '13', '14'], days.toString())){
            output += days + ' дня';
        }else{
            output += days + ' дней';
        }
        status = false;
    }
    if (hrs != 0){
        if (status){
            if (hrs.toString().endsWith('1') && !hrs.toString().endsWith('11')){
                output += hrs + ' час';
            }else if (endsWithAny(['2', '3', '4'], hrs.toString()) && !endsWithAny(['12', '13', '14'], hrs.toString())){
                output += hrs + ' часа';
            }else{
                output += hrs + ' часов';
            }
            status = false;
        }
    }
    if (mins != 0){
        if (status){
            if (mins.toString().endsWith('1') && !mins.toString().endsWith('11')){
                output += mins + ' минуту';
            }else if (endsWithAny(['2', '3', '4'], mins.toString()) && !endsWithAny(['12', '13', '14'], mins.toString())){
                output += mins + ' минуты';
            }else{
                output += mins + ' минут';
            }
            status = false;
        }
    }
    if (secs != 0){
        if (status){
            if (secs.toString().endsWith('1') && !secs.toString().endsWith('11')){
                output += secs + ' секунду';
            }else if (endsWithAny(['2', '3', '4'], secs.toString()) && !endsWithAny(['12', '13', '14'], secs.toString())){
                output += secs + ' секунды';
            }else{
                output += secs + ' секунд';
            }
            status = false;
        }
    }
    if (ms != 0){
        if (status){
            output += ms + ' ms';
        }
    }
    return output;
}

bot.on('guildMemberAdd', async member => {
    if (member.guild.id != serverid) return
    levelhigh++;
    if (levelhigh >= 5){
        if (!member.hasPermission("MANAGE_ROLES")){
            member.ban(`SYSTEM: DDOS ATTACK`);
            console.log(`${member.id} - заблокирован за ДДОС.`)
        }
        setTimeout(() => {
            if (levelhigh > 0){
                levelhigh--;
            }
        }, 60000*levelhigh);
    }else{
        setTimeout(() => {
            if (levelhigh > 0){
                levelhigh--;
            }
        }, 60000*levelhigh);
    }
})