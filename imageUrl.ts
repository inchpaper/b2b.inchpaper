/**
 * Utility to parse and normalize image URLs, especially Google Drive public share links.
 * Standard Google Drive links (e.g. /file/d/ID/view) are HTML viewer pages that fail inside <img> tags.
 * This utility converts them into direct-embed image endpoints from Google's high-speed CDN.
 */

export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Pattern 1: /file/d/([a-zA-Z0-9_-]+)
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // Pattern 2: id=([a-zA-Z0-9_-]+)
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  // Pattern 3: /open?id=([a-zA-Z0-9_-]+)
  const openMatch = trimmed.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch && openMatch[1]) {
    return openMatch[1];
  }

  // Pattern 4: /thumbnail?id=([a-zA-Z0-9_-]+)
  const thumbMatch = trimmed.match(/\/thumbnail\?.*id=([a-zA-Z0-9_-]+)/);
  if (thumbMatch && thumbMatch[1]) {
    return thumbMatch[1];
  }

  // Pattern 5: /d/([a-zA-Z0-9_-]+) (e.g., lh3.googleusercontent.com/d/ID)
  const directDMatch = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (directDMatch && directDMatch[1]) {
    return directDMatch[1];
  }

  return null;
}

export function formatCatalogImageUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  // Check if it's already a Data URL (base64)
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Check if it's a Google Drive link
  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    // lh3.googleusercontent.com/d/ID directly streams the raw image from Google's CDN with no HTML wrapper
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  return trimmed;
}

export function getGoogleDriveFallbackUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  const driveId = extractGoogleDriveFileId(rawUrl);
  if (driveId) {
    // Secondary Google Drive thumbnail proxy at 1600px width
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`;
  }
  return rawUrl || '';
}

export function isGoogleDriveLink(url?: string): boolean {
  if (!url) return false;
  return !!extractGoogleDriveFileId(url);
}
