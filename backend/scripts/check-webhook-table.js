const mysql = require("mysql2/promise");
const { loadEnv } = require("../src/config/env");

loadEnv();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    const [tables] = await conn.query("SHOW TABLES LIKE 'payment_webhook_events'");
    console.log("table exists:", tables.length > 0);
    if (!tables.length) return;
    const [cols] = await conn.query("DESCRIBE payment_webhook_events");
    console.log("columns:", cols.map((c) => `${c.Field}:${c.Type}`).join(", "));
    const [payments] = await conn.query(
      "SELECT id, payway_tran_id, status FROM payments ORDER BY created_at DESC LIMIT 3",
    );
    console.log("payments:", JSON.stringify(payments, null, 2));
    const [rows] = await conn.query(
      "SELECT id, payment_id, event_key, processed, error, created_at FROM payment_webhook_events ORDER BY id DESC LIMIT 10",
    );
    console.log("webhook events:", JSON.stringify(rows, null, 2));

    if (payments[0]) {
      const pay = payments[0];
      const eventKey = `${pay.payway_tran_id}:0:test`;
      try {
        const [ins] = await conn.query(
          `INSERT INTO payment_webhook_events (payment_id, event_key, payload, processed, processed_at, error)
           VALUES (?, ?, ?, 0, NULL, NULL)`,
          [pay.id, eventKey, JSON.stringify({ test: true })],
        );
        console.log("test insert ok id=", ins.insertId);
        await conn.query("DELETE FROM payment_webhook_events WHERE event_key = ?", [eventKey]);
      } catch (insErr) {
        console.error("test insert failed:", insErr.code, insErr.message);
      }
    }
  } catch (err) {
    console.error("ERR", err.code, err.message);
  } finally {
    await conn.end();
  }
}

main();
