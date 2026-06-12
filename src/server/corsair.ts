import 'dotenv/config';
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { conn } from './db/index';



export const corsair = createCorsair({
    plugins: [gmail(), googlecalendar()],
    database: conn,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true,
});

/**
 * Returns whether the given tenant (next-auth user id) has Gmail and
 * Google Calendar connected through Corsair.
 */
export async function getConnectionFlags(tenantId: string) {
    const status = await corsair.manage.connectionStatus.get({ tenantId });
    return {
        gmail: status.gmail === "connected",
        calendar: status.googlecalendar === "connected",
    };
}