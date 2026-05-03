import fs from 'fs';

function replaceInFile(file, replacements) {
  let content = fs.readFileSync(file, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(file, content);
}

replaceInFile('src/context/NotebookContext.tsx', [
  ["import React, { createContext, useState, useContext, ReactNode } from 'react';", "import React, { createContext, useState, useContext } from 'react';\nimport type { ReactNode } from 'react';"]
]);

replaceInFile('src/pages/AdversaryEmulation.tsx', [
  ["import { Play, Shield, Terminal, Skull, AlertTriangle, Zap, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';", "import { Play, Shield, Skull, Zap, CheckCircle2, RefreshCw } from 'lucide-react';"]
]);

replaceInFile('src/pages/BlastRadius.tsx', [
  ["import { Target, ShieldAlert, Crosshair, Network, ArrowRight, Zap, Skull, Shield, Server, HardDrive } from 'lucide-react';", "import { Target, Network, ArrowRight, Zap, Skull, Server, HardDrive } from 'lucide-react';"]
]);

replaceInFile('src/pages/GeoMap.tsx', [
  ["import React, { useEffect, useState, useRef, useMemo } from 'react';", "import React, { useEffect, useState, useRef } from 'react';"],
  ["const globeRef = useRef<any>();", "const globeRef = useRef<any>(null);"]
]);

replaceInFile('src/pages/PayloadAnalyzer.tsx', [
  ["import { Terminal, Code, Cpu, RefreshCw, ChevronRight, FileCode, Search, ShieldAlert } from 'lucide-react';", "import { Terminal, Code, Cpu, RefreshCw, FileCode, Search, ShieldAlert } from 'lucide-react';"]
]);

replaceInFile('src/pages/RansomwareTracker.tsx', [
  ["import { Newspaper, ShieldAlert, Globe, AlertTriangle, Building, Building2, Server, Key, Filter, Search, Skull } from 'lucide-react';", "import { Newspaper, Globe, Building2, Server, Filter, Search, Skull } from 'lucide-react';"]
]);

console.log("Fixed all imports!");
