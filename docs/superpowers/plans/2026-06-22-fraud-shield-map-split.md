# Fraud Shield Map Split Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate a split-screen layout in the Fraud Shield tab with the interactive Leaflet map on the right and the transcript inputs/analysis results in a scrollable sidebar on the left.

**Architecture:** Update `ShieldPanel` using a Tailwind grid (cols-5) containing a `ScrollArea` panel (cols-2) and a card-wrapped Leaflet `MapContainer` (cols-3) using the `CartoDB Dark Matter` night mode tiles.

**Tech Stack:** React, TypeScript, Leaflet, React-Leaflet, Tailwind CSS.

---

### Task 1: Update ShieldPanel Component and Integrate Leaflet Map

**Files:**
- Modify: [shield-panel.tsx](file:///c:/Users/91934/Desktop/development/digitalSafety/frontend/src/components/shield/shield-panel.tsx)

- [ ] **Step 1: Write the updated imports and fetch state**
  Add Leaflet css and component imports, and a state to fetch and store hotspots data:
  ```typescript
  import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
  import 'leaflet/dist/leaflet.css';
  ```
  And inside the `ShieldPanel` function:
  ```typescript
  const [hotspots, setHotspots] = useState<any[]>([]);

  // Fetch hotspots to display on the threat map
  useEffect(() => {
    async function loadHotspots() {
      try {
        const res = await fetch('/api/geo/hotspots?days=30');
        const data = await res.json();
        setHotspots(data.hotspots || []);
      } catch {
        setHotspots([]);
      }
    }
    loadHotspots();
  }, []);
  ```

- [ ] **Step 2: Update the JSX template layout**
  Replace the existing layout grid (around line 99) with the split cols-5 layout containing the ScrollArea sidebar and the Leaflet Map container:
  ```tsx
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-180px)]">
        {/* Left Column: Input + Results (40% width / 2 cols) */}
        <div className="lg:col-span-2 h-full">
          <ScrollArea className="h-full pr-2">
            <div className="space-y-6 pb-6">
              {/* Input Panel */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Card className="bg-slate-900/50 border-slate-700/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      <CardTitle className="text-base text-slate-200">Citizen Fraud Shield</CardTitle>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter the call transcript you received. Our AI engine will analyze it for known scam patterns.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Paste the suspicious call transcript here... e.g., 'This is CBI calling, there is a warrant for your arrest...'"
                      className="min-h-[160px] bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 resize-none focus-visible:ring-emerald-500/30 text-xs"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                    />

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-xs text-slate-400">Caller Number (optional)</Label>
                        <Input
                          placeholder="+91 XXXXX XXXXX"
                          className="mt-1 h-8 bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus-visible:ring-emerald-500/30 text-xs"
                          value={callerNumber}
                          onChange={(e) => setCallerNumber(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <Label className="text-xs text-slate-400">
                          <Video className="h-3.5 w-3.5 inline mr-1" />
                          Video
                        </Label>
                        <Switch checked={isVideo} onCheckedChange={setIsVideo} />
                      </div>
                    </div>

                    <Button
                      onClick={analyze}
                      disabled={loading || !transcript.trim()}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium text-xs py-1.5 h-8 shadow-lg shadow-emerald-500/20"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-4 w-4 mr-2" />
                          Analyze Threat
                        </>
                      )}
                    </Button>

                    <Separator className="bg-slate-800" />

                    <div>
                      <p className="text-[10px] text-slate-500 mb-1.5">Quick-load sample transcripts:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {SAMPLE_TRANSCRIPTS.map((sample) => (
                          <button
                            key={sample.label}
                            onClick={() => loadSample(sample.text)}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/70 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600/50 transition-colors"
                          >
                            {sample.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Results Panel */}
              <AnimatePresence mode="wait">
                {result && !loading && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-700/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          {result.riskScore > 70 ? (
                            <AlertOctagon className="h-5 w-5 text-rose-400" />
                          ) : result.riskScore > 40 ? (
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          )}
                          <CardTitle className="text-base text-slate-200">Analysis Results</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Score Circle */}
                        <div className="flex justify-center">
                          <div className="relative">
                            <svg width="110" height="110" viewBox="0 0 140 140">
                              <circle cx="70" cy="70" r="58" fill="none" stroke="currentColor" className="text-slate-800" strokeWidth="8" />
                              <motion.circle
                                cx="70" cy="70" r="58" fill="none"
                                stroke={result.riskScore > 70 ? '#f43f5e' : result.riskScore > 40 ? '#f59e0b' : '#10b981'}
                                strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 58}
                                initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 58 - (result.riskScore / 100) * 2 * Math.PI * 58 }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                transform="rotate(-90 70 70)"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold text-slate-100 tabular-nums">{result.riskScore.toFixed(0)}</span>
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider">Risk Score</span>
                            </div>
                          </div>
                        </div>

                        {/* Verdict */}
                        <div className={`text-center p-2.5 rounded-lg border text-xs ${getThreatColor(result.threatLevel).bg} ${getThreatColor(result.threatLevel).border}`}>
                          <p className={`font-semibold ${getThreatColor(result.threatLevel).text}`}>
                            {result.verdict}
                          </p>
                        </div>

                        {/* Signal Badges */}
                        {result.matchedSignals && result.matchedSignals.length > 0 && (
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium mb-1.5">DETECTED SIGNALS</p>
                            <div className="flex flex-wrap gap-1.5">
                              {result.matchedSignals.map((sig, i) => (
                                <Badge key={sig.signalType} variant="outline" className="text-[9px] border-rose-500/30 text-rose-400 bg-rose-500/5 px-2 py-0.5">
                                  {sig.signalType} ({sig.weight.toFixed(0)})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Severity Bar */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-400">Severity</span>
                            <span className={`text-[10px] font-semibold ${getThreatColor(result.threatLevel).text}`}>
                              {result.threatLevel}
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${result.riskScore}%` }}
                              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                              className="h-full rounded-full"
                              style={{
                                background: result.riskScore > 70
                                  ? 'linear-gradient(90deg, #f59e0b, #f43f5e)'
                                  : result.riskScore > 40
                                  ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                                  : 'linear-gradient(90deg, #10b981, #34d399)',
                              }}
                            />
                          </div>
                        </div>

                        {/* Next Steps */}
                        {result.nextSteps && (
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium mb-1.5">RECOMMENDED ACTIONS</p>
                            <div className="bg-slate-800/40 rounded-lg p-2.5 space-y-1.5">
                              {result.nextSteps.split('\n').filter(Boolean).map((step, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                  <ChevronRight className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                  <span className="text-[11px] text-slate-300">{step.replace(/^\d+\.\s*/, '')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Right Column: Interactive Map Area (60% width / 3 cols) */}
        <div className="lg:col-span-3 h-full">
          <Card className="bg-slate-900/50 border-slate-700/50 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-sm font-semibold text-slate-200">Threat Geospatial Distribution</h3>
              </div>
              <span className="text-[10px] text-slate-400">
                {hotspots.length} Active Hotspot Areas
              </span>
            </div>
            <div className="flex-1 w-full relative min-h-[300px] z-10">
              <MapContainer center={[22.9734, 78.6569]} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                {hotspots.map((hotspot: any, idx: number) => {
                  const lat = hotspot.latitude;
                  const lng = hotspot.longitude;
                  if (!lat || !lng) return null;
                  
                  return (
                    <CircleMarker 
                      key={idx} 
                      center={[lat, lng]} 
                      radius={Math.max(6, Math.min(22, hotspot.reportCount * 3.5))}
                      color="#f43f5e"
                      fillColor="#f43f5e"
                      fillOpacity={0.4}
                      weight={2}
                    >
                      <Popup>
                        <div className="p-1 text-slate-900">
                          <h4 className="font-bold text-xs">{hotspot.city}, {hotspot.state}</h4>
                          <p className="text-[10px] mt-1">Total Reports: {hotspot.reportCount}</p>
                          <p className="text-[10px]">Severity Level: {hotspot.severity}/5</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
  ```

- [ ] **Step 3: Compile and verify the build**
  Run: `docker compose exec frontend npm run build`
  Expected: Successful Vite compilation without TypeScript errors.
