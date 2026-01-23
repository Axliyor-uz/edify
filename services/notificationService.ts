import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type NotificationType = 'assignment' | 'submission' | 'request' | 'result' | 'alert';

export async function sendNotification(
  userId: string, // The person RECEIVING the notification
  type: NotificationType,
  title: string, 
  message: string, 
  link?: string
) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      title,
      message,
      link: link || null,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to send notification", error);
  }
}