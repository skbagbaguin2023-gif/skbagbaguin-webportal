function doPost(event) {
  const expectedToken = PropertiesService.getScriptProperties().getProperty('GMAIL_MAILER_SECRET');
  let payload;

  try {
    payload = JSON.parse(event.postData.contents);
  } catch (_error) {
    return jsonOutput({ ok: false, error: 'Invalid request body.' });
  }
  if (!payload || typeof payload !== 'object') {
    return jsonOutput({ ok: false, error: 'Invalid request body.' });
  }

  if (payload.action === 'sync_kk_profile') {
    const kkToken = PropertiesService.getScriptProperties().getProperty('KK_FORM_SYNC_SECRET');
    if (!kkToken || payload.token !== kkToken) {
      return jsonOutput({ ok: false, error: 'Unauthorized.' });
    }
    try {
      return jsonOutput(syncKkProfile(payload));
    } catch (error) {
      console.error('Unable to sync the KK profile to Google Forms.', error);
      return jsonOutput({ ok: false, error: error instanceof Error ? error.message : 'Unable to submit the Google Form response.' });
    }
  }

  if (!expectedToken || payload.token !== expectedToken) {
    return jsonOutput({ ok: false, error: 'Unauthorized.' });
  }

  const recipient = typeof payload.to === 'string' ? payload.to.trim() : '';
  const subject = typeof payload.subject === 'string' ? payload.subject.replace(/[\r\n]/g, ' ').trim() : '';
  const html = typeof payload.html === 'string' ? payload.html : '';
  const senderName = typeof payload.senderName === 'string' ? payload.senderName : 'Kabataan ng Bagbaguin';
  const reply = typeof payload.reply === 'string' ? payload.reply : '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) || !subject || !html || !reply) {
    return jsonOutput({ ok: false, error: 'A valid recipient and complete reply are required.' });
  }

  try {
    GmailApp.sendEmail(
      recipient,
      subject,
      `Good day ${senderName},\n\n${reply}\n\nRespectfully,\nSK Bagbaguin Youth Council`,
      {
        htmlBody: html,
        name: 'SK Bagbaguin Youth Council',
        replyTo: 'skbagbaguin.2023@gmail.com',
      },
    );
    return jsonOutput({ ok: true });
  } catch (error) {
    console.error('GmailApp could not send the council reply.', error);
    return jsonOutput({ ok: false, error: 'Gmail could not send the email.' });
  }
}

function syncKkProfile(payload) {
  const formId = PropertiesService.getScriptProperties().getProperty('KK_FORM_ID');
  if (!formId) throw new Error('Set the KK_FORM_ID script property to the existing Google Form ID.');
  const portalId = typeof payload.portalId === 'string' ? payload.portalId : '';
  const profile = payload.profile;
  if (!/^app-[0-9a-f-]{36}$/i.test(portalId) || !profile || typeof profile !== 'object') {
    throw new Error('The KK profile submission is incomplete.');
  }

  const form = FormApp.openById(formId);
  const destinationId = form.getDestinationId();
  if (!destinationId) throw new Error('The Google Form is not linked to a response spreadsheet.');
  const spreadsheet = SpreadsheetApp.openById(destinationId);
  let logSheet = spreadsheet.getSheetByName('Portal Sync Log');
  if (!logSheet) {
    logSheet = spreadsheet.insertSheet('Portal Sync Log');
    logSheet.appendRow(['Portal Submission ID', 'Google Form Response ID', 'Synced At']);
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const existing = logSheet.getRange(2, 1, Math.max(logSheet.getLastRow() - 1, 1), 1)
      .createTextFinder(portalId)
      .matchEntireCell(true)
      .findNext();
    if (existing) return { ok: true, alreadySynced: true };

    const response = form.createResponse();
    addKkAnswer(form, response, ['EMAIL ACCOUNT'], profile.email);
    addKkAnswer(form, response, ['FIRST NAME'], profile.firstName);
    addKkAnswer(form, response, ['MIDDLE NAME'], profile.middleName);
    addKkAnswer(form, response, ['LAST NAME'], profile.lastName);
    addKkAnswer(form, response, ['SEX/GENDER IDENTITY'], profile.genderIdentity);
    addKkAnswer(form, response, ['AGE'], String(profile.age));
    addKkAnswer(form, response, ['BIRTHDAY'], profile.birthday);
    addKkAnswer(form, response, ['BIRTHPLACE'], profile.birthplace);
    addKkAnswer(form, response, ['CONTACT NUMBER'], profile.contactNumber);
    addKkAnswer(form, response, ['CIVIL STATUS'], profile.civilStatus);
    const sitioResponse = profile.sitioAddress === 'Iba pa:'
      ? `Iba pa: ${profile.sitioOther || ''}`.trim()
      : profile.sitioAddress;
    addKkAnswer(form, response, ['STREET/SITIO ADDRESS'], sitioResponse);
    addKkAnswer(form, response, ['COMPLETE ADDRESS'], profile.completeAddress);
    addKkAnswer(form, response, ['ARE YOU REGISTERED VOTER IN BARANGAY BAGBAGUIN OR RESIDENT ONLY?'], profile.voterStatus);
    addKkAnswer(form, response, ['DID YOU VOTE LAST SK ELECTION?'], profile.votedLastSkElection);
    const voteCountResponse = profile.skElectionVoteCount === 'Iba pa:'
      ? profile.skElectionVoteCountOther || 'Iba pa:'
      : profile.skElectionVoteCount;
    addKkAnswer(form, response, ['HOW MANY TIMES DID YOU VOTE FOR SK ELECTIONS?'], voteCountResponse);
    addKkAnswer(form, response, ['ARE YOU REGISTERED NATIONAL VOTER?'], profile.nationalVoter);
    addKkAnswer(form, response, ['IF YES, WHAT IS YOUR PRECINT NUMBER?', 'IF YES, WHAT IS YOUR PRECINCT NUMBER?'], profile.precinctNumber);
    addKkAnswer(form, response, ['YOUTH CLASSIFICATION'], profile.youthClassifications);
    addKkAnswer(form, response, ['WORK STATUS'], profile.workStatus);
    addKkAnswer(form, response, ['EDUCATIONAL BACKGROUND'], profile.educationalBackground);

    const submittedResponse = response.submit();
    logSheet.appendRow([portalId, submittedResponse.getId(), new Date()]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function authorizeKkFormAccess() {
  const formId = PropertiesService.getScriptProperties().getProperty('KK_FORM_ID');
  if (!formId) throw new Error('Set the KK_FORM_ID script property before authorizing access.');

  const form = FormApp.openById(formId);
  const destinationId = form.getDestinationId();
  if (!destinationId) throw new Error('The Google Form is not linked to a response spreadsheet.');

  const spreadsheet = SpreadsheetApp.openById(destinationId);
  console.log(`Authorized access to "${form.getTitle()}" and "${spreadsheet.getName()}".`);
}

function addKkAnswer(form, response, acceptedTitles, value) {
  const normalize = (title) => title.toLowerCase().replace(/[^a-z0-9]/g, '');
  const expectedTitles = acceptedTitles.map(normalize);
  const item = form.getItems().find((candidate) => expectedTitles.includes(normalize(candidate.getTitle())));
  if (!item) throw new Error(`Could not find the Google Form question: ${acceptedTitles[0]}`);

  const answer = Array.isArray(value) ? value : String(value ?? '');
  let itemResponse;
  switch (item.getType()) {
    case FormApp.ItemType.TEXT:
      itemResponse = item.asTextItem().createResponse(Array.isArray(answer) ? answer.join(', ') : answer);
      break;
    case FormApp.ItemType.MULTIPLE_CHOICE:
      itemResponse = item.asMultipleChoiceItem().createResponse(Array.isArray(answer) ? answer[0] : answer);
      break;
    case FormApp.ItemType.CHECKBOX:
      itemResponse = item.asCheckboxItem().createResponse(Array.isArray(answer) ? answer : [answer]);
      break;
    case FormApp.ItemType.DATE: {
      const dateParts = String(answer).split('-').map(Number);
      if (dateParts.length !== 3 || dateParts.some((part) => !part)) {
        throw new Error('Enter a valid birthday before submitting.');
      }
      itemResponse = item.asDateItem().createResponse(new Date(dateParts[0], dateParts[1] - 1, dateParts[2]));
      break;
    }
    default:
      throw new Error(`The Google Form question "${item.getTitle()}" uses an unsupported answer type.`);
  }
  response.withItemResponse(itemResponse);
}

function jsonOutput(result) {
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
