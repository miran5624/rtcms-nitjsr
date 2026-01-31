import cron from 'node-cron';
import { pool } from '../config/database.js';

export function initCronJobs(): void {
  cron.schedule('*/5 * * * *', async () => {
    const r = await pool.query(
      `update complaints set priority = 'high'
       where status in ('open') and priority in ('low', 'medium')
         and created_at < now() - interval '30 minutes'
       returning id`
    );
    const count = r.rowCount ?? 0;
    if (count > 0) {
      console.log(`[cron] Priority bump: ${count} complaint(s) updated`);
    }
  });

  cron.schedule('0 * * * *', async () => {
    const r = await pool.query<{ id: number }>(
      `update complaints set escalation_flag = true
       where status not in ('resolved', 'rejected') and escalation_flag = false
         and created_at < now() - interval '24 hours'
       returning id`
    );
    const ids = r.rows.map((row) => row.id);
    if (ids.length > 0) {
      console.log('[cron] Super admin escalation:', ids);
    }
  });
}
