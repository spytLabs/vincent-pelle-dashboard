import { SettingsForm } from "@/components/settings-form";
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
    return (
        <div className="flex flex-col h-full min-h-screen bg-muted/20">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 shadow-sm sticky top-0 z-10 w-full transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4 w-full justify-between">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/">
                                        Dashboard
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Settings</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-4xl w-full flex flex-col gap-6 bg-background rounded-xl border p-6 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Logistics Settings</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Manage default coordinates, vehicle types, and pickup details for new orders.</p>
                    </div>
                    <Separator />

                    <div className="py-4">
                        <SettingsForm />
                    </div>
                </div>
            </main>
        </div>
    );
}
