/**
 * Shared TypeScript types for the Pharmacy Sales Dashboard.
 */

export interface LineItem {
    medicineName: string;
    quantity: number;
    costPerPiece: number;
    subtotal: number;
}

export interface BillFormData {
    customerName?: string;
    paymentMode: "CASH" | "CARD" | "PAYTM";
    hasPrescription: boolean;
    lineItems: LineItem[];
}

export interface BillSummary {
    id: string;
    billNumber: string;
    createdAt: string;
    customerName: string | null;
    paymentMode: "CASH" | "CARD" | "PAYTM";
    hasPrescription: boolean;
    prescriptionCharge: number;
    medicinesSubtotal: number;
    grandTotal: number;
    itemCount: number;
    employeeName: string;
}

export interface DashboardStats {
    totalRevenue: number;
    billCount: number;
    cashTotal: number;
    cardTotal: number;
    paytmTotal: number;
    prescriptionCount: number;
    nonPrescriptionCount: number;
    prescriptionChargesTotal: number;
}

export interface TopMedicine {
    medicineName: string;
    totalUnits: number;
    rank: number;
}

export interface RevenueTrend {
    date: string;
    revenue: number;
    billCount: number;
}
