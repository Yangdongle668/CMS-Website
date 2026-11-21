// Mail queue: deleting dead letters.
//
// Deletion is permanent, so it is limited to messages that are already dead.
// Anything still pending, failed or sending is live work and must be cancelled
// first; these tests hold that line for both the single and the bulk delete.

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers/server');

async function insertMail(srv, status) {
  return Number(await srv.sql(
    `INSERT INTO mail_outbox (kind, to_addr, subject, html, status)
     VALUES ('test', 'ops@example.test', 'Test ${status}', '<p>x</p>', '${status}')
     RETURNING id`
  ));
}

test('mail queue', async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());

  await t.test('deleting is not allowed anonymously', async () => {
    const id = await insertMail(srv, 'dead');
    assert.equal((await srv.request('/api/mail-queue/' + id, { method: 'DELETE' })).status, 401);
    assert.equal((await srv.request('/api/mail-queue/delete-all-dead', { method: 'POST' })).status, 401);
    assert.equal(await srv.sql(`SELECT count(*) FROM mail_outbox WHERE id = ${id}`), '1');
  });

  await t.test('an operator can delete a single dead letter', async () => {
    await srv.request('/api/auth/login', {
      method: 'POST',
      json: { email: 'ops@example.test', password: 'a-strong-password-2026' },
    });
    const id = await insertMail(srv, 'dead');
    const res = await srv.request('/api/mail-queue/' + id, { method: 'DELETE' });
    assert.equal(res.status, 200);
    assert.equal(await srv.sql(`SELECT count(*) FROM mail_outbox WHERE id = ${id}`), '0');
  });

  await t.test('a message that is not dead cannot be deleted', async () => {
    for (const status of ['pending', 'failed', 'sending', 'sent']) {
      const id = await insertMail(srv, status);
      const res = await srv.request('/api/mail-queue/' + id, { method: 'DELETE' });
      assert.equal(res.status, 409, `${status} message is refused`);
      assert.equal(res.json.error, 'not_deletable');
      assert.equal(await srv.sql(`SELECT count(*) FROM mail_outbox WHERE id = ${id}`), '1');
    }
  });

  await t.test('delete-all-dead removes only dead letters', async () => {
    await insertMail(srv, 'dead');
    await insertMail(srv, 'dead');
    const live = await insertMail(srv, 'pending');
    const deadBefore = Number(await srv.sql(`SELECT count(*) FROM mail_outbox WHERE status = 'dead'`));

    const res = await srv.request('/api/mail-queue/delete-all-dead', { method: 'POST' });
    assert.equal(res.status, 200);
    assert.equal(res.json.count, deadBefore);
    assert.equal(await srv.sql(`SELECT count(*) FROM mail_outbox WHERE status = 'dead'`), '0');
    assert.equal(await srv.sql(`SELECT count(*) FROM mail_outbox WHERE id = ${live}`), '1');

    const stats = await srv.request('/api/mail-queue/stats');
    assert.equal(stats.json.dead, 0);
  });
});
