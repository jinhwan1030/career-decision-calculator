import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Dashboard } from "../features/dashboard/Dashboard";
import { JobComparisonPage } from "../features/jobComparison/JobComparisonPage";
import { ResignationPage } from "../features/resignation/ResignationPage";
import {
  clearAppData,
  deleteScenario,
  duplicateScenario,
  importAppData,
  loadAppData,
  saveAppData,
  upsertScenario,
} from "../lib/storage/scenarioStorage";
import type { AppRoute } from "./routes";
import type { Scenario } from "../types/scenario";
import type { AppData } from "../types/settings";

export function App() {
  const [route, setRoute] = useState<AppRoute>("dashboard");
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [activeScenario, setActiveScenario] = useState<Scenario | undefined>();
  const [storageMessage, setStorageMessage] = useState<string | undefined>();
  // 파괴적 액션(초기화/삭제) 직전 상태를 보관해 "실행 취소"로 되돌린다.
  const [undoSnapshot, setUndoSnapshot] = useState<AppData | undefined>();

  useEffect(() => {
    setData(loadAppData());
  }, []);

  const saveScenario = (scenario: Scenario) => {
    try {
      setData(upsertScenario(scenario));
      setActiveScenario(undefined);
      setUndoSnapshot(undefined);
      setStorageMessage("시나리오를 저장했습니다.");
      setRoute("dashboard");
    } catch {
      setStorageMessage("저장에 실패했습니다. 브라우저 저장 공간이나 시크릿 모드 설정을 확인하세요.");
    }
  };

  const removeScenario = (id: string) => {
    try {
      const previous = data;
      setData(deleteScenario(id));
      setUndoSnapshot(previous);
      setStorageMessage("시나리오를 삭제했습니다.");
    } catch {
      setStorageMessage("삭제 결과를 저장하지 못했습니다. 브라우저 저장 공간을 확인하세요.");
    }
  };

  const copyScenario = (id: string) => {
    try {
      setData(duplicateScenario(id));
      setUndoSnapshot(undefined);
      setStorageMessage("시나리오 복사본을 만들었습니다.");
    } catch {
      setStorageMessage("복제 결과를 저장하지 못했습니다. 브라우저 저장 공간을 확인하세요.");
    }
  };

  const resetData = () => {
    try {
      const previous = data;
      setData(clearAppData());
      setActiveScenario(undefined);
      setUndoSnapshot(previous);
      setStorageMessage("저장된 데이터를 초기화했습니다.");
    } catch {
      setStorageMessage("초기화 결과를 저장하지 못했습니다. 브라우저 저장 공간을 확인하세요.");
    }
  };

  const undoLastChange = () => {
    if (!undoSnapshot) return;

    try {
      saveAppData(undoSnapshot);
      setData(undoSnapshot);
      setUndoSnapshot(undefined);
      setStorageMessage("직전 작업을 되돌렸습니다.");
    } catch {
      setStorageMessage("되돌리기 결과를 저장하지 못했습니다. 브라우저 저장 공간을 확인하세요.");
    }
  };

  const openScenario = (scenario: Scenario) => {
    setActiveScenario(scenario);
    setRoute(scenario.type === "job_comparison" ? "jobComparison" : "resignation");
  };

  const startNew = (nextRoute: AppRoute) => {
    setActiveScenario(undefined);
    setRoute(nextRoute);
  };

  const importData = (rawJson: string) => {
    try {
      const nextData = importAppData(rawJson);
      setData(nextData);
      setActiveScenario(undefined);
      setUndoSnapshot(undefined);
      setStorageMessage("JSON 데이터를 가져왔습니다.");
    } catch (error) {
      setStorageMessage(error instanceof Error ? error.message : "JSON 데이터를 가져오지 못했습니다.");
      throw error;
    }
  };

  return (
    <AppShell route={route} onRouteChange={startNew}>
      {route === "dashboard" && (
        <Dashboard
          scenarios={data.scenarios}
          message={storageMessage}
          onRouteChange={startNew}
          onOpen={openScenario}
          onDuplicate={copyScenario}
          onClear={resetData}
          onDelete={removeScenario}
          onImport={importData}
          onUndo={undoSnapshot ? undoLastChange : undefined}
        />
      )}
      {route === "jobComparison" && (
        <JobComparisonPage scenario={activeScenario} onSave={saveScenario} />
      )}
      {route === "resignation" && (
        <ResignationPage scenario={activeScenario} onSave={saveScenario} />
      )}
    </AppShell>
  );
}
