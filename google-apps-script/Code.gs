function doPost(event) {
  const expectedToken = PropertiesService.getScriptProperties().getProperty('GMAIL_MAILER_SECRET');
  let payload;

  try {
    payload = JSON.parse(event.postData.contents);
  } catch (_error) {
    return jsonOutput({ ok: false, error: 'Invalid request body.' });
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

function jsonOutput(result) {
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
