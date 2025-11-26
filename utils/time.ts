/**
 * Formats a timestamp as a human-readable "time ago" string
 * @param timestamp - The timestamp in milliseconds
 * @returns A formatted string like "5 mins ago", "2 hours ago", "1 day ago"
 */
export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  // Convert to minutes
  const minutes = Math.floor(diff / 60000);
  
  // If less than 60 minutes, show minutes
  if (minutes < 60) {
    if (minutes < 1) {
      return 'Just now';
    }
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
  }
  
  // Convert to hours
  const hours = Math.floor(minutes / 60);
  
  // If less than 24 hours, show hours
  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Show days
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
};

