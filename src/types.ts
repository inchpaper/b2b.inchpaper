export interface CorporateCatalogItem {
  id: string;
  title: string;
  buttonText: string;
  imageUrl: string;
  driveLink: string;
  category?: string;
  description?: string;
  badge?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}
