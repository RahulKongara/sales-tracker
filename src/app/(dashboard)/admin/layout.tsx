import AdminSidebar from "@/components/AdminSidebar";

/**
 * Layout for all /admin/* pages.
 * Renders the shared sidebar and offsets the main content area.
 */
export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-dvh">
            <AdminSidebar />

            {/* Main content — offset by sidebar width on desktop,
                bottom-padded on mobile for the bottom bar */}
            <main className="md:ml-56 pb-16 md:pb-0 min-h-dvh">
                {children}
            </main>
        </div>
    );
}
