import { database } from '@/config/firebase';
import { getCurrentUser } from '@/utils/auth';
import { get, ref, set, push } from 'firebase/database';

export interface ViewHistoryItem {
  id: string;
  itemId: string;
  type: 'article' | 'podcast' | 'live-event';
  title: string;
  description?: string;
  category?: string;
  timestamp: number;
  viewedAt: number;
}

/**
 * Track when a user views an article, podcast, or live event
 * If the item was already viewed, updates the existing entry instead of creating a duplicate
 */
export const trackView = async (
  itemId: string,
  type: 'article' | 'podcast' | 'live-event',
  itemData: {
    title: string;
    description?: string;
    category?: string;
    timestamp?: number;
  }
) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser?.uid) {
      console.log('⚠️ [ViewHistory] No user logged in, skipping view tracking');
      return;
    }

    const viewHistoryRef = ref(database, `users/${currentUser.uid}/viewHistory`);
    
    // Check if this item was already viewed
    const snapshot = await get(viewHistoryRef);
    let existingEntryKey: string | null = null;
    
    if (snapshot.exists()) {
      const viewHistoryData = snapshot.val();
      // Find existing entry with same itemId and type
      for (const key in viewHistoryData) {
        if (viewHistoryData[key].itemId === itemId && viewHistoryData[key].type === type) {
          existingEntryKey = key;
          break;
        }
      }
    }

    const viewItem: ViewHistoryItem = {
      id: existingEntryKey || '',
      itemId: itemId,
      type: type,
      title: itemData.title || 'Untitled',
      description: itemData.description || '',
      category: itemData.category || 'NHL',
      timestamp: itemData.timestamp || Date.now(),
      viewedAt: Date.now(),
    };

    if (existingEntryKey) {
      // Update existing entry
      const existingEntryRef = ref(database, `users/${currentUser.uid}/viewHistory/${existingEntryKey}`);
      await set(existingEntryRef, viewItem);
      console.log('✅ [ViewHistory] View updated:', { itemId, type, title: itemData.title });
    } else {
      // Create new entry
      const newViewRef = push(viewHistoryRef);
      viewItem.id = newViewRef.key || '';
      await set(newViewRef, viewItem);
      console.log('✅ [ViewHistory] View tracked:', { itemId, type, title: itemData.title });
    }
  } catch (error) {
    console.error('❌ [ViewHistory] Error tracking view:', error);
  }
};

