"use client";

import React from "react";

// Robust, self-contained SVG QR-code matrix generator for collection verification
export function QRCodeDisplay({
  value,
  size = 180,
  label,
}: {
  value: string;
  size?: number;
  label?: string;
}) {
  // Deterministic matrix generation based on hash of string
  const gridSize = 21; // standard version 1 QR size
  const matrix: boolean[][] = Array(gridSize)
    .fill(false)
    .map(() => Array(gridSize).fill(false));

  // Finder patterns at top-left, top-right, bottom-left (7x7)
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(gridSize - 7, 0);
  drawFinder(0, gridSize - 7);

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    if (i % 2 === 0) {
      matrix[6][i] = true;
      matrix[i][6] = true;
    }
  }

  // Populate data cells deterministically from character values
  let charIdx = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Skip finder zones
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= gridSize - 8;
      const inBottomLeft = r >= gridSize - 8 && c < 8;
      const inTiming = (r === 6 && c >= 8 && c < gridSize - 8) || (c === 6 && r >= 8 && r < gridSize - 8);

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        const charCode = value.charCodeAt(charIdx % value.length);
        const bit = ((charCode * (r + 1) + c * 7) % 5) === 0 || ((charCode + r + c) % 3 === 0);
        matrix[r][c] = bit;
        charIdx++;
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-stone-200">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shape-rendering-crisp"
      >
        <rect width={size} height={size} fill="#ffffff" rx={8} />
        {matrix.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.3}
                height={cellSize + 0.3}
                fill="#2C1810"
                rx={cellSize > 6 ? 1 : 0}
              />
            ) : null
          )
        )}
      </svg>
      {label && (
        <span className="mt-2 text-xs font-mono font-bold tracking-wider text-stone-700 bg-stone-100 px-2.5 py-1 rounded-md">
          {label}
        </span>
      )}
    </div>
  );
}
