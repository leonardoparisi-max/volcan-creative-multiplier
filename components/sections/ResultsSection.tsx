"use client";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ImportPanel } from "@/components/results/ImportPanel";
import { RankingPanel } from "@/components/results/RankingPanel";
import { LearningsPanel } from "@/components/results/LearningsPanel";

export function ResultsSection() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Tabs defaultValue="importar">
      <TabsList className="mb-4">
        <TabsTrigger value="importar">Importar CSV</TabsTrigger>
        <TabsTrigger value="ranking">Ranking</TabsTrigger>
        <TabsTrigger value="aprendizado">Aprendizado</TabsTrigger>
      </TabsList>
      <TabsContent value="importar">
        <ImportPanel onImported={() => setRefreshKey((k) => k + 1)} />
      </TabsContent>
      <TabsContent value="ranking">
        <RankingPanel refreshKey={refreshKey} />
      </TabsContent>
      <TabsContent value="aprendizado">
        <LearningsPanel />
      </TabsContent>
    </Tabs>
  );
}
