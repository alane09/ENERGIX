import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-64" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-[150px]" />
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="charts">Graphiques</TabsTrigger>
            <TabsTrigger value="monthly-data">Données mensuelles</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6">
              <Card className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-8 w-full" />
                <div className="mt-4 grid gap-4">
                  <Skeleton className="h-24 w-full" />
                </div>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i}>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-4 w-48 mt-1" />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <Skeleton className="h-6 w-40 mb-4" />
                  <div className="space-y-4">
                    <div>
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-4 w-64 mt-1" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
