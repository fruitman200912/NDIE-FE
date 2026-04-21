"use client";
import React, { useEffect, useRef, useState } from "react";
import { getFirebaseDb } from "@/lib/firebase";

type OrgNode = {
  name: string;
  level: number;
  child?: OrgNode[];
};

const defaultData: OrgNode = {
  name: "root",
  level: 0,
  child: [],
};

const MAX_HISTORY = 20;

export default function OrgChartEditor() {
  const [data, setData] = useState<OrgNode>(defaultData);
  const [history, setHistory] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPath, setSelectedPath] = useState<number[] | null>(null);
  const [draggedPath, setDraggedPath] = useState<number[] | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    path: number[];
    position: "left" | "right" | "child";
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const handleUndoRef = useRef<() => void>(() => {});
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndoRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const loadData = async () => {
    try {
      const db = await getFirebaseDb();
      if (!db) return;
      const { doc, getDoc } = await import("firebase/firestore");
      const docRef = doc(db, "organization", "chart");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setData(docSnap.data() as OrgNode);
      }
    } catch (e) {
      console.error("조직도 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    setSaving(true);
    try {
      const db = await getFirebaseDb();
      if (!db) return;
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "organization", "chart"), data);
      alert("저장되었습니다!");
    } catch (e) {
      console.error("저장 실패:", e);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const pushHistory = (currentData: OrgNode) => {
    setHistory((prev) => {
      const next = [...prev, JSON.parse(JSON.stringify(currentData))];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
  };

  const handleUndo = () => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const restored = prev[prev.length - 1];
      setData(restored);
      setSelectedPath(null);
      return prev.slice(0, -1);
    });
  };
  handleUndoRef.current = handleUndo;

  const countDescendants = (node: OrgNode): number => {
    if (!node.child || node.child.length === 0) return 0;
    return node.child.reduce(
      (sum, child) => sum + 1 + countDescendants(child),
      0
    );
  };

  const updateNode = (path: number[], field: "name", value: string) => {
    const newData = JSON.parse(JSON.stringify(data));
    let node = newData;
    for (const idx of path) {
      node = node.child![idx];
    }
    node[field] = value;
    setData(newData);
  };

  const recalculateLevels = (node: OrgNode, level: number): OrgNode => {
    node.level = level;
    if (node.child) {
      node.child = node.child.map((child) => recalculateLevels(child, level + 1));
    }
    return node;
  };

  const addChild = (path: number[]) => {
    pushHistory(data);
    const newData = JSON.parse(JSON.stringify(data));
    let node = newData;
    for (const idx of path) {
      node = node.child![idx];
    }
    if (!node.child) node.child = [];
    node.child.push({ name: "새 항목", level: node.level + 1 });
    setData(newData);
  };

  const deleteNode = (path: number[]) => {
    if (path.length === 0) return;

    let target: OrgNode = data;
    for (let i = 0; i < path.length - 1; i++) {
      target = target.child![path[i]];
    }
    target = target.child![path[path.length - 1]];

    const descendantCount = countDescendants(target);

    if (descendantCount > 0) {
      const confirmed = confirm(
        `'${target.name}' 노드와 하위 ${descendantCount}개의 노드가 모두 삭제됩니다.\n계속하시겠습니까?`
      );
      if (!confirmed) return;
    }

    pushHistory(data);

    const newData = JSON.parse(JSON.stringify(data));
    let parent = newData;
    for (let i = 0; i < path.length - 1; i++) {
      parent = parent.child![path[i]];
    }
    parent.child!.splice(path[path.length - 1], 1);
    setData(newData);
    setSelectedPath(null);
  };

  const addSiblingLeft = (path: number[]) => {
    if (path.length === 0) return;
    pushHistory(data);
    const newData = JSON.parse(JSON.stringify(data));
    let parent = newData;
    for (let i = 0; i < path.length - 1; i++) {
      parent = parent.child![path[i]];
    }
    const currentIndex = path[path.length - 1];
    const currentLevel = parent.child![currentIndex].level;
    parent.child!.splice(currentIndex, 0, { name: "새 항목", level: currentLevel });
    setData(newData);
  };

  const addSiblingRight = (path: number[]) => {
    if (path.length === 0) return;
    pushHistory(data);
    const newData = JSON.parse(JSON.stringify(data));
    let parent = newData;
    for (let i = 0; i < path.length - 1; i++) {
      parent = parent.child![path[i]];
    }
    const currentIndex = path[path.length - 1];
    const currentLevel = parent.child![currentIndex].level;
    parent.child!.splice(currentIndex + 1, 0, { name: "새 항목", level: currentLevel });
    setData(newData);
  };

  const moveNode = (
    fromPath: number[],
    toPath: number[],
    position: "left" | "right" | "child"
  ) => {
    if (fromPath.length === 0) return;
    const fromStr = fromPath.join("-");
    const toStr = toPath.join("-");
    if (toStr.startsWith(fromStr) || fromStr === toStr) return;

    try {
      pushHistory(data);
      const newData = JSON.parse(JSON.stringify(data));
      let fromParent = newData;
      for (let i = 0; i < fromPath.length - 1; i++) {
        if (!fromParent.child || !fromParent.child[fromPath[i]]) return;
        fromParent = fromParent.child[fromPath[i]];
      }
      const fromIndex = fromPath[fromPath.length - 1];
      if (!fromParent.child || !fromParent.child[fromIndex]) return;
      const movedNode = JSON.parse(JSON.stringify(fromParent.child[fromIndex]));

      if (position === "child") {
        let toParent = newData;
        for (const idx of toPath) {
          if (!toParent.child || !toParent.child[idx]) return;
          toParent = toParent.child[idx];
        }
        fromParent.child.splice(fromIndex, 1);
        if (!toParent.child) toParent.child = [];
        toParent.child.push(recalculateLevels(movedNode, toParent.level + 1));
      } else {
        let toParent = newData;
        for (let i = 0; i < toPath.length - 1; i++) {
          if (!toParent.child || !toParent.child[toPath[i]]) return;
          toParent = toParent.child[toPath[i]];
        }
        if (!toParent.child) return;
        const toIndex = toPath[toPath.length - 1];
        const sameParent =
          fromPath.slice(0, -1).join("-") === toPath.slice(0, -1).join("-");
        fromParent.child.splice(fromIndex, 1);
        let adjustedToIndex = toIndex;
        if (sameParent && fromIndex < toIndex) {
          adjustedToIndex = toIndex - 1;
        }
        const insertIndex =
          position === "left" ? adjustedToIndex : adjustedToIndex + 1;
        const newLevel =
          toParent.child[Math.min(adjustedToIndex, toParent.child.length - 1)]
            ?.level ?? toParent.level + 1;
        toParent.child.splice(
          insertIndex,
          0,
          recalculateLevels(movedNode, newLevel)
        );
      }
      setData(newData);
    } catch (error) {
      console.error("노드 이동 중 오류:", error);
    } finally {
      setDraggedPath(null);
      setDropTarget(null);
      setSelectedPath(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, path: number[]) => {
    if (path.length === 0) {
      e.preventDefault();
      return;
    }
    setDraggedPath(path);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (
    e: React.DragEvent,
    path: number[],
    position: "left" | "right" | "child"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedPath) return;
    const draggedStr = draggedPath.join("-");
    const targetStr = path.join("-");
    if (targetStr.startsWith(draggedStr) || draggedStr === targetStr) return;
    setDropTarget({ path, position });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedPath && dropTarget) {
      moveNode(draggedPath, dropTarget.path, dropTarget.position);
    }
  };

  const handleDragEnd = () => {
    setDraggedPath(null);
    setDropTarget(null);
  };

  const handleNodeClick = (e: React.MouseEvent, path: number[]) => {
    e.stopPropagation();
    setSelectedPath(selectedPath?.join("-") === path.join("-") ? null : path);
  };

  const renderNode = (node: OrgNode, path: number[] = []) => {
    const levelColors = [
      "bg-orange-500 border-orange-600 text-white",
      "bg-orange-400 border-orange-500 text-white",
      "bg-orange-300 border-orange-400",
      "bg-white border-orange-300",
    ];
    const colorClass = levelColors[Math.min(node.level, 3)];
    const isSelected = selectedPath?.join("-") === path.join("-");
    const isRoot = path.length === 0;
    const isDragging = draggedPath?.join("-") === path.join("-");
    const isDropLeft =
      dropTarget?.path.join("-") === path.join("-") &&
      dropTarget?.position === "left";
    const isDropRight =
      dropTarget?.path.join("-") === path.join("-") &&
      dropTarget?.position === "right";
    const isDropChild =
      dropTarget?.path.join("-") === path.join("-") &&
      dropTarget?.position === "child";
    const hasChildren = node.child && node.child.length > 0;

    return (
      <div className="flex flex-col items-center" key={path.join("-")}>
        <div className="flex items-center relative">
          {/* 왼쪽 드롭존 */}
          {!isRoot && (
            <div
              onDragOver={(e) => handleDragOver(e, path, "left")}
              onDrop={handleDrop}
              className={`w-4 h-10 transition-all rounded ${
                isDropLeft ? "bg-blue-400 w-6" : draggedPath ? "hover:bg-blue-200" : ""
              }`}
            />
          )}

          {/* 노드 카드 */}
          <div
            draggable={!isRoot}
            onDragStart={(e) => handleDragStart(e, path)}
            onDragEnd={handleDragEnd}
            onClick={(e) => handleNodeClick(e, path)}
            className={`relative cursor-pointer transition-all duration-150 ${
              isDragging ? "opacity-50 scale-95" : ""
            }`}
          >
            <div
              onDragOver={(e) => handleDragOver(e, path, "child")}
              onDrop={handleDrop}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 ${colorClass} ${
                isSelected ? "ring-2 ring-blue-400 ring-offset-2" : ""
              } ${isDropChild ? "ring-2 ring-green-400 ring-offset-2" : ""}`}
            >
              <input
                type="text"
                value={node.name}
                onChange={(e) => updateNode(path, "name", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onDragStart={(e) => e.stopPropagation()}
                draggable={false}
                className="bg-transparent text-center font-semibold w-28 outline-none cursor-text"
              />
            </div>

            {/* 액션 버튼 */}
            {isSelected && !isDragging && (
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex gap-1 bg-white rounded-lg shadow-lg p-1 z-20">
                {!isRoot && (
                  <button
                    onClick={(e) => { e.stopPropagation(); addSiblingLeft(path); }}
                    className="w-8 h-8 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 flex items-center justify-center"
                    title="왼쪽에 추가"
                  >←</button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); addChild(path); }}
                  className="w-8 h-8 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 flex items-center justify-center"
                  title="하위 추가"
                >↓</button>
                {!isRoot && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); addSiblingRight(path); }}
                      className="w-8 h-8 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 flex items-center justify-center"
                      title="오른쪽에 추가"
                    >→</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNode(path); }}
                      className="w-8 h-8 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center justify-center"
                      title="삭제"
                    >×</button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 오른쪽 드롭존 */}
          {!isRoot && (
            <div
              onDragOver={(e) => handleDragOver(e, path, "right")}
              onDrop={handleDrop}
              className={`w-4 h-10 transition-all rounded ${
                isDropRight ? "bg-blue-400 w-6" : draggedPath ? "hover:bg-blue-200" : ""
              }`}
            />
          )}
        </div>

        {/* 자식 노드들 + 간선 */}
        {hasChildren && (
          <div className="flex flex-col items-center">
            {/* 부모에서 내려오는 수직선 */}
            <svg width="2" height="20" className="overflow-visible">
              <line x1="1" y1="0" x2="1" y2="20" stroke="#9CA3AF" strokeWidth="2" />
            </svg>

            {/* 자식들 컨테이너 */}
            <div className="relative">
              {/* 수평 연결선 (SVG) */}
              {node.child!.length > 1 && (
                <svg
                  className="absolute top-0 left-0 w-full overflow-visible"
                  height="2"
                  style={{ transform: "translateY(-1px)" }}
                >
                  <line
                    x1="50"
                    y1="1"
                    x2={`calc(100% - 50px)`}
                    y2="1"
                    stroke="#9CA3AF"
                    strokeWidth="2"
                  />
                </svg>
              )}

              <div className="flex gap-6">
                {node.child!.map((child, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    {/* 각 자식으로 내려가는 수직선 */}
                    <svg width="2" height="20" className="overflow-visible">
                      <line x1="1" y1="0" x2="1" y2="20" stroke="#9CA3AF" strokeWidth="2" />
                    </svg>
                    {renderNode(child, [...path, idx])}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="flex justify-center items-center h-64">로딩 중...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">조직도 관리</h2>
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Ctrl+Z"
          >
            ↩ 되돌리기 <span className="text-gray-400 text-xs">(Ctrl+Z)</span>
          </button>
        </div>
        <button
          onClick={saveData}
          disabled={saving}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>

      <div
        className="flex justify-center py-8 overflow-auto min-h-[400px]"
        onClick={() => setSelectedPath(null)}
      >
        {renderNode(data)}
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm text-gray-600 space-y-1">
        <p>• 노드를 <strong>드래그</strong>하여 좌/우/하위로 이동</p>
        <p>• 노드 <strong>클릭</strong> → 편집 버튼 (← ↓ → ×)</p>
        <p>• <strong>Ctrl+Z</strong> 또는 되돌리기 버튼으로 최대 {MAX_HISTORY}단계 복구 가능</p>
      </div>
    </div>
  );
}
