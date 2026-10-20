/**
 * ProMarketing · отговори — Google Apps Script в Gmail-а на Ивайло
 * (emmgivailopetev38@gmail.com). Живее на script.google.com като проект
 * „ProMarketing · отговори“; това е копието му в репото.
 *
 * Какво прави на всеки 15 минути:
 *   1. пита CRM-а от кои адреси да гледа (всеки, получил автоматично писмо
 *      в последните 60 дни) — GET /api/crm/email-reply;
 *   2. търси в Gmail писма от тези адреси за последните 3 дни;
 *   3. праща ги на CRM-а — POST /api/crm/email-reply. Там всяко ново писмо
 *      влиза в картона като „📨 Получен имейл“, човекът е „чут“ (поредицата
 *      спира) и идва Telegram.
 *
 * Чете само заглавката (От, Тема), датата и краткия откъс, който Gmail сам
 * показва в списъка. Не праща нищо от писма на други хора. Не пише, не трие,
 * не праща поща (правото е само gmail.readonly).
 *
 * Без таен ключ: CRM-ът проверява OpenID токена на скрипта при Google.
 *
 * Пускане (веднъж): изберете функцията `ustanovi` → Run → Allow.
 * Спиране: Triggers (часовничето вляво) → изтрий тригера на `proveri`.
 */

var CRM = 'https://promarketing.pw/api/crm/email-reply';
var GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
/** Адреси в една заявка към Gmail — дългата заявка Gmail я реже. */
var CHUNK = 25;

/** Създава тригера на 15 минути и пуска първата проверка веднага. */
function ustanovi() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'proveri') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('proveri').timeBased().everyMinutes(15).create();
  proveri();
}

function proveri() {
  var crmAuth = { Authorization: 'Bearer ' + ScriptApp.getIdentityToken() };
  var list = UrlFetchApp.fetch(CRM, { headers: crmAuth, muteHttpExceptions: true });
  if (list.getResponseCode() !== 200) {
    throw new Error('CRM отказа списъка: ' + list.getResponseCode() + ' ' + list.getContentText().slice(0, 300));
  }
  var emails = JSON.parse(list.getContentText()).emails || [];
  if (emails.length === 0) return;

  var watch = {};
  emails.forEach(function (e) { watch[e] = true; });
  var gmailAuth = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };

  var seen = {};
  var messages = [];
  for (var i = 0; i < emails.length; i += CHUNK) {
    var q = 'from:(' + emails.slice(i, i + CHUNK).join(' OR ') + ') newer_than:3d';
    var res = gmailGet(GMAIL + '?maxResults=50&q=' + encodeURIComponent(q), gmailAuth);
    (res.messages || []).forEach(function (m) {
      if (seen[m.id]) return;
      seen[m.id] = true;
      var full = gmailGet(
        GMAIL + '/' + m.id + '?format=metadata&metadataHeaders=From&metadataHeaders=Subject',
        gmailAuth
      );
      var labels = full.labelIds || [];
      if (labels.indexOf('SENT') >= 0 || labels.indexOf('DRAFT') >= 0) return;
      var from = header(full, 'From');
      if (!watch[senderEmail(from)]) return;
      messages.push({
        gmail_id: full.id,
        thread_id: full.threadId,
        from: from,
        subject: header(full, 'Subject'),
        date: new Date(Number(full.internalDate)).toISOString(),
        text: full.snippet || '',
      });
    });
  }
  if (messages.length === 0) return;

  var post = UrlFetchApp.fetch(CRM, {
    method: 'post',
    contentType: 'application/json',
    headers: crmAuth,
    payload: JSON.stringify({ messages: messages }),
    muteHttpExceptions: true,
  });
  if (post.getResponseCode() !== 200) {
    throw new Error('CRM отказа писмата: ' + post.getResponseCode() + ' ' + post.getContentText().slice(0, 300));
  }
  console.log(post.getContentText().slice(0, 500));
}

function gmailGet(url, auth) {
  var r = UrlFetchApp.fetch(url, { headers: auth, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('Gmail: ' + r.getResponseCode() + ' ' + r.getContentText().slice(0, 300));
  return JSON.parse(r.getContentText());
}

function header(msg, name) {
  var hs = (msg.payload && msg.payload.headers) || [];
  for (var i = 0; i < hs.length; i++) if (hs[i].name.toLowerCase() === name.toLowerCase()) return hs[i].value;
  return '';
}

function senderEmail(from) {
  var m = String(from).match(/<([^<>\s]+@[^<>\s]+)>/) || String(from).match(/([^\s<>"]+@[^\s<>"]+)/);
  return m ? m[1].toLowerCase() : '';
}
