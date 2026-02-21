import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/export/csv?from=YYYY-MM-DD&to=YYYY-MM-DD&format=detailed|summary
 * Generates a CSV download of all bills in the date range.
 *
 * format=detailed (default): One row per line item.
 * format=summary: One row per bill with aggregated totals.
 */
export async function GET(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { searchParams } = req.nextUrl;
        const fromParam = searchParams.get("from");
        const toParam = searchParams.get("to");
        const format = searchParams.get("format") || "detailed";

        // Default: today
        const now = new Date();
        const todayStr = now.toLocaleDateString("en-CA", {
            timeZone: "Asia/Kolkata",
        });
        const to = toParam
            ? new Date(`${toParam}T23:59:59.999+05:30`)
            : new Date(`${todayStr}T23:59:59.999+05:30`);
        const from = fromParam
            ? new Date(`${fromParam}T00:00:00.000+05:30`)
            : new Date(`${todayStr}T00:00:00.000+05:30`);

        const bills = await prisma.bill.findMany({
            where: {
                createdAt: { gte: from, lte: to },
                isDeleted: false,
            },
            include: {
                user: { select: { fullName: true, username: true } },
                lineItems: { orderBy: { sortOrder: "asc" } },
            },
            orderBy: { createdAt: "asc" },
        });

        function escapeCsv(val: string): string {
            if (val.includes(",") || val.includes('"') || val.includes("\n")) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }

        let headers: string[];
        const rows: string[][] = [];

        if (format === "summary") {
            // ── Summary format: one row per bill ──
            headers = [
                "Bill Number",
                "Date",
                "Time (IST)",
                "Customer",
                "Payment Mode",
                "Prescription",
                "Rx Charge",
                "Items Count",
                "Medicines Subtotal",
                "Grand Total",
                "Created By",
            ];

            for (const bill of bills) {
                const dateIST = bill.createdAt.toLocaleDateString("en-CA", {
                    timeZone: "Asia/Kolkata",
                });
                const timeIST = bill.createdAt.toLocaleTimeString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                });

                rows.push([
                    bill.billNumber,
                    dateIST,
                    timeIST,
                    bill.customerName || "Walk-in",
                    bill.paymentMode,
                    bill.hasPrescription ? "Yes" : "No",
                    Number(bill.prescriptionCharge).toFixed(2),
                    bill.lineItems.length.toString(),
                    Number(bill.medicinesSubtotal).toFixed(2),
                    Number(bill.grandTotal).toFixed(2),
                    bill.user.fullName,
                ]);
            }
        } else {
            // ── Detailed format: one row per line item (default) ──
            headers = [
                "Bill Number",
                "Date",
                "Time (IST)",
                "Customer",
                "Payment Mode",
                "Prescription",
                "Rx Charge",
                "Medicine",
                "Qty",
                "Cost/Piece",
                "Subtotal",
                "Grand Total",
                "Created By",
            ];

            for (const bill of bills) {
                const dateIST = bill.createdAt.toLocaleDateString("en-CA", {
                    timeZone: "Asia/Kolkata",
                });
                const timeIST = bill.createdAt.toLocaleTimeString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                });

                for (const li of bill.lineItems) {
                    rows.push([
                        bill.billNumber,
                        dateIST,
                        timeIST,
                        bill.customerName || "Walk-in",
                        bill.paymentMode,
                        bill.hasPrescription ? "Yes" : "No",
                        Number(bill.prescriptionCharge).toFixed(2),
                        li.medicineName,
                        li.quantity.toString(),
                        Number(li.costPerPiece).toFixed(2),
                        Number(li.subtotal).toFixed(2),
                        Number(bill.grandTotal).toFixed(2),
                        bill.user.fullName,
                    ]);
                }
            }
        }

        const csv = [
            headers.map(escapeCsv).join(","),
            ...rows.map((row) => row.map(escapeCsv).join(",")),
        ].join("\n");

        const formatLabel = format === "summary" ? "summary" : "detailed";
        const filename = `bills_${formatLabel}_${fromParam || todayStr}_to_${toParam || todayStr}.csv`;

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("CSV export error:", error);
        return NextResponse.json(
            { error: "Failed to export CSV" },
            { status: 500 }
        );
    }
}
