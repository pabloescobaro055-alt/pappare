import {demoMode,pendingNotifications,deliveredNotification} from './orders';
import {sendTelegramText} from '@/lib/notifications';
export async function flushCinemaNotifications() {
  if(demoMode()) return; // Local testing never sends guest information to the real chat.
  for(const item of await pendingNotifications()) {
    try {if(await sendTelegramText(String(item.text))) await deliveredNotification(String(item.id));} catch { console.error('Cinema notification delivery failed; retained for retry'); }
  }
}
