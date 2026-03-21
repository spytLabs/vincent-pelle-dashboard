import { getOrders } from "@/lib/google-sheets";
import { OrderTable } from "@/components/order-table";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

import { checkWaybillsQuantity } from "@/lib/check-waybills";

import spytXvincent from "@/public/spytXvincent.png";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const orders = await getOrders();
  const waybillsCount = await checkWaybillsQuantity();

  return (
    <div className="flex flex-col h-full min-h-screen bg-muted/20">
      <header className="flex h-18 shrink-0 items-center gap-2 border-b bg-background px-4 shadow-sm sticky top-0 z-10 w-full transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <img src={spytXvincent.src} alt="Spyt x Vincent" className="h-15 w-auto" />
          {/* <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Orders</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb> */}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Recent Orders
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Review and manage your store's latest transactions.
              </p>
            </div>
            <div className="text-sm text-muted-foreground border rounded-md px-3 py-1 bg-accent">
               Remaining Waybills: {waybillsCount}
            </div>
          </div>

          {waybillsCount < 10 && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9V7a1 1 0 112 0v2a1 1 0 11-2 0zm0 4v-2a1 1 0 112 0v2a1 1 0 11-2 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Your remaining waybills are running low. Please request more from Koombiyo Dashboard to avoid disruptions in your delivery process.
                  </h3>
                </div>
              </div>
            </div>
          )}

          <OrderTable orders={orders} />
        </div>
      </main>
    </div>
  );
}
