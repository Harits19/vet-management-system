export interface IProduct {
  name: string;
  barcode?: string;
  category: string;
  cost_price: number;
  sell_price: number;
  stock: number;
  unit: string;
  expired_date?: Date;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
