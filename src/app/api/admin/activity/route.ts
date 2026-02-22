import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { parseISTDateParam } from "@/lib/utils";

/**
 * GET /api/admin/activity?page=1&limit=50&employee=&paymentMode=&from=&to=
 *
 * Returns:
 *  - Paginated bill list (filterable by employee, payment mode, date range)
 *  - Per-employee summary stats for the filtered range
 *  - Audit log entries for the filtered bills
 */
export async function GET(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const sp = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(sp.get("page") || "1"));
        const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "50")));
        const skip = (page - 1) * limit;

        // Build dynamic where clause
        const where: Prisma.BillWhereInput = { isDeleted: false };

        // Employee filter
        const employeeId = sp.get("employee");
        if (employeeId) {
            where.createdBy = employeeId;
        }

        // Payment mode filter
        const paymentMode = sp.get("paymentMode");
        if (paymentMode && ["CASH", "CARD", "PAYTM"].includes(paymentMode)) {
            where.paymentMode = paymentMode as "CASH" | "CARD" | "PAYTM";
        }

        // Date range filter (only apply if valid YYYY-MM-DD)
        const parsedFrom = parseISTDateParam(sp.get("from"));
        const parsedTo = parseISTDateParam(sp.get("to"));
        if (parsedFrom || parsedTo) {
            where.createdAt = {};
            if (parsedFrom) where.createdAt.gte = parsedFrom.start;
            if (parsedTo) where.createdAt.lte = parsedTo.end;
        }

        // Fetch bills + total count in parallel
        const [bills, total] = await Promise.all([
            prisma.bill.findMany({
                where,
                include: {
                    user: { select: { username: true, fullName: true } },
                    _count: { select: { lineItems: true } },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.bill.count({ where }),
        ]);

        // Per-employee summary for the filtered range
        const employeeSummary = await prisma.bill.groupBy({
            by: ["createdBy"],
            where,
            _sum: { grandTotal: true },
            _count: { id: true },
        });

        // Get employee names for the summary
        const employeeIds = employeeSummary.map((e) => e.createdBy);
        const employees = await prisma.user.findMany({
            where: { id: { in: employeeIds } },
            select: { id: true, fullName: true, username: true },
        });
        const employeeMap = new Map(employees.map((e) => [e.id, e]));

        // Recent audit log entries (for the audit tab)
        const auditLogs = await prisma.auditLog.findMany({
            include: {
                user: { select: { username: true, fullName: true } },
                bill: { select: { billNumber: true } },
            },
            orderBy: { timestamp: "desc" },
            take: 20,
        });

        return NextResponse.json({
            bills: bills.map((b) => ({
                id: b.id,
                billNumber: b.billNumber,
                createdAt: b.createdAt.toISOString(),
                customerName: b.customerName,
                paymentMode: b.paymentMode,
                hasPrescription: b.hasPrescription,
                prescriptionCharge: Number(b.prescriptionCharge),
                grandTotal: Number(b.grandTotal),
                itemCount: b._count.lineItems,
                createdByName: b.user.fullName,
                createdByUser: b.user.username,
                createdById: b.createdBy,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            employeeSummary: employeeSummary.map((e) => ({
                employeeId: e.createdBy,
                employeeName: employeeMap.get(e.createdBy)?.fullName || "Unknown",
                employeeUser: employeeMap.get(e.createdBy)?.username || "unknown",
                billCount: e._count.id,
                totalRevenue: Number(e._sum.grandTotal || 0),
            })),
            auditLogs: auditLogs.map((log) => ({
                id: log.id,
                action: log.actionType,
                billNumber: log.bill.billNumber,
                performedBy: log.user.fullName,
                performedByUser: log.user.username,
                notes: log.notes,
                timestamp: log.timestamp.toISOString(),
            })),
        });
    } catch (error) {
        console.error("Activity log error:", error);
        return NextResponse.json(
            { error: "Failed to fetch activity data" },
            { status: 500 }
        );
    }
}
