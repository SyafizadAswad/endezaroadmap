import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Target, Zap, Wifi, CheckCircle, Circle, Brain, AlertCircle, Loader2, X } from 'lucide-react';
import { geminiService, GeneratedRoadmap, Subject } from './services/geminiService';
import { dataService } from './services/dataService';

interface RoadmapFlowchartProps {
  roadmap: GeneratedRoadmap;
  onNodeClick: (node: any) => void;
  selectedNodeId: string | null;
}

function RoadmapFlowchart({ roadmap, onNodeClick, selectedNodeId }: RoadmapFlowchartProps) {
  // Sort nodes by year and semester
  const sortedNodes = [...(roadmap.nodes || [])].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.semester !== b.semester) return a.semester - b.semester;
    return a.name.localeCompare(b.name);
  });

  // Group nodes by (year, semester)
  const groupMap: { [key: string]: typeof sortedNodes } = {};
  sortedNodes.forEach(node => {
    const key = `${node.year}-${node.semester}`;
    if (!groupMap[key]) groupMap[key] = [];
    groupMap[key].push(node);
  });

  // Get all unique (year, semester) pairs, sorted
  const allYearSemPairs = Array.from(
    new Set(sortedNodes.map(n => `${n.year}-${n.semester}`))
  ).map(pair => pair.split('-').map(Number) as [number, number])
   .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  // Layout: rows for each (year, semester), stack horizontally
  const yStep = 120;
  const xStep = 180;
  const yStart = 100;
  const xStart = 100;
  const nodePositions: { [id: string]: { x: number; y: number } } = {};

  allYearSemPairs.forEach(([year, semester], rowIdx) => {
    const key = `${year}-${semester}`;
    const nodes = groupMap[key] || [];
    nodes.forEach((node, colIdx) => {
      nodePositions[node.id] = {
        x: xStart + colIdx * xStep,
        y: yStart + rowIdx * yStep,
      };
    });
  });

  const getNodeColor = (node: any) => {
    if (selectedNodeId === node.id) return 'bg-blue-600 text-white border-blue-700';
    switch (node.type) {
      case 'foundation': return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
      case 'core': return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200';
      case 'specialized': return 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200';
      case 'elective': return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200';
      default: return 'bg-white text-gray-800 border-gray-300';
    }
  };

  const renderConnections = () => {
    if (!sortedNodes || !Array.isArray(sortedNodes)) {
      return [];
    }
    return sortedNodes.map(node => 
      node.connects.map(targetId => {
        const target = sortedNodes.find(n => n.id === targetId);
        if (!target) return null;
        const from = nodePositions[node.id];
        const to = nodePositions[target.id];
        return (
          <line
            key={`${node.id}-${targetId}`}
            x1={from.x + 60}
            y1={from.y + 20}
            x2={to.x + 60}
            y2={to.y + 20}
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray="5,5"
            className="opacity-60"
          />
        );
      })
    ).flat();
  };

  if (!roadmap || !sortedNodes || !Array.isArray(sortedNodes)) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">
          <p>Invalid roadmap data. Please try generating a new roadmap.</p>
        </div>
      </div>
    );
  }

  // Calculate minWidth and minHeight for the container
  const maxCols = Math.max(...Object.values(groupMap).map(nodes => nodes.length));
  const minWidth = xStart + maxCols * xStep + 200;
  const minHeight = yStart + allYearSemPairs.length * yStep + 200;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 overflow-auto">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800">{roadmap.title}</h3>
        <p className="text-gray-600">{roadmap.description}</p>
        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-1">AI Reasoning:</h4>
          <p className="text-sm text-blue-700">{roadmap.reasoning}</p>
        </div>
      </div>
      <div className="relative" style={{ minHeight, minWidth }}>
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {renderConnections()}
        </svg>
        {sortedNodes.map(node => (
          <div
            key={node.id}
            className={`absolute border-2 rounded-lg p-3 cursor-pointer transition-all text-sm font-medium min-w-24 text-center shadow-sm ${getNodeColor(node)}`}
            style={{ 
              left: nodePositions[node.id].x, 
              top: nodePositions[node.id].y, 
              zIndex: 2,
              maxWidth: '140px'
            }}
            onClick={() => onNodeClick(node)}
          >
            <div className="flex items-center justify-center mb-1">
              <Circle className="h-4 w-4 mr-1" />
            </div>
            <div className="text-xs leading-tight mb-1">{node.name}</div>
            <div className="text-xs text-gray-500">
              {node.credits} credits • Y{node.year}S{node.semester}
            </div>
            <div className="text-xs text-gray-400">
              {Math.round(node.relevance_score * 100)}% relevant
            </div>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
          <span>Foundation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
          <span>Core</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
          <span>Specialized</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
          <span>Elective</span>
        </div>
      </div>
    </div>
  );
}

function SubjectDetailsPanel({ subject, onClose }: { subject: Subject | null, onClose: () => void }) {
  if (!subject) return null;
  return (
    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto transition-all">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">{subject.name}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="h-6 w-6" /></button>
      </div>
      <div className="p-4 space-y-4">
        <div><span className="font-semibold">Code:</span> {subject.code}</div>
        <div><span className="font-semibold">Credits:</span> {subject.credits}</div>
        <div><span className="font-semibold">Year:</span> {subject.year}</div>
        <div><span className="font-semibold">Semester:</span> {subject.semester}</div>
        <div><span className="font-semibold">Department:</span> {subject.department}</div>
        <div><span className="font-semibold">Description:</span> <div className="text-gray-700 text-sm mt-1">{subject.description}</div></div>
        <div><span className="font-semibold">Syllabus:</span>
          <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
            {subject.syllabus.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
        </div>
        <div><span className="font-semibold">Prerequisites:</span> {subject.prerequisites.length > 0 ? subject.prerequisites.join(', ') : 'None'}</div>
        <div><span className="font-semibold">Keywords:</span> {subject.keywords.join(', ')}</div>
        <div><span className="font-semibold">Learning Outcomes:</span>
          <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
            {subject.learning_outcomes.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
        </div>
        {subject.career_relevance && (
          <div><span className="font-semibold">Career Relevance:</span>
            <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
              {Object.entries(subject.career_relevance).map(([career, score]) => (
                <li key={career}>{career}: {Math.round(Number(score) * 100)}%</li>
              ))}
            </ul>
          </div>
        )}
        {subject.career_relevance_reason && (
          <div><span className="font-semibold">Relevance Reason:</span>
            <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
              {Object.entries(subject.career_relevance_reason).map(([career, reason]) => (
                <li key={career}><span className="font-semibold">{career}:</span> {reason}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseRoadmapTool() {
  const [dreamOccupation, setDreamOccupation] = useState('');
  const [roadmap, setRoadmap] = useState<GeneratedRoadmap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const occupationIcons = {
    "electrical engineer": Zap,
    "communication engineer": Wifi,
    "aerospace engineer": Target,
    "power engineer": Zap,
    "electronics engineer": Zap,
    "software engineer": Brain,
    "control engineer": Target,
    "robotics engineer": Target
  };

  useEffect(() => {
    // Load subjects on component mount
    const loadSubjects = async () => {
      try {
        setIsLoadingData(true);
        console.log('Starting to load subjects...');
        const allSubjects = await dataService.getAllSubjects();
        console.log('Subjects loaded in component:', allSubjects.length);
        // Enrich with Gemini API
        if (process.env.REACT_APP_GEMINI_API_KEY) {
          const enriched = await geminiService.enrichSubjectsWithCareerRelevance(allSubjects);
          setSubjects(enriched);
        } else {
          setSubjects(allSubjects);
        }
      } catch (error) {
        console.error('Error loading subjects:', error);
        setError('Failed to load syllabus data');
      } finally {
        setIsLoadingData(false);
      }
    };
    loadSubjects();
  }, []);

  const generateRoadmap = async () => {
    if (!dreamOccupation.trim()) return;
    if (isLoadingData) {
      setError('Please wait for syllabus data to finish loading.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (!process.env.REACT_APP_GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
      }
      console.log('Generating roadmap for:', dreamOccupation);
      console.log('Number of subjects available:', subjects.length);
      if (subjects.length === 0) {
        throw new Error('No subjects available. Please check if syllabus data is loading correctly.');
      }
      const generatedRoadmap = await geminiService.generateRoadmap(dreamOccupation, subjects);
      console.log('Generated roadmap:', generatedRoadmap);
      if (!generatedRoadmap || !generatedRoadmap.nodes || !Array.isArray(generatedRoadmap.nodes)) {
        throw new Error('Invalid roadmap data received from AI');
      }
      setRoadmap(generatedRoadmap);
      setSelectedSubject(null);
      setSelectedNodeId(null);
    } catch (error) {
      console.error('Error generating roadmap:', error);
      if (error instanceof Error) {
        setError(`Failed to generate roadmap: ${error.message}`);
      } else {
        setError('Failed to generate roadmap. Please check your API key and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNodeClick = (node: any) => {
    setSelectedNodeId(node.id);
    const subject = subjects.find(s => s.id === node.id);
    setSelectedSubject(subject || null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Tokushima University Course Roadmap
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              AI-powered course roadmap for Electrical and Electronic System Course students
            </p>
            {!process.env.REACT_APP_GEMINI_API_KEY && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg max-w-md mx-auto">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">API Key Required</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Set REACT_APP_GEMINI_API_KEY in your environment variables to enable AI-powered roadmaps.
                </p>
              </div>
            )}
          </div>
          {/* Input Section */}
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your dream occupation?
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={dreamOccupation}
                    onChange={(e) => setDreamOccupation(e.target.value)}
                    placeholder="e.g., Electrical Engineer, Communication Engineer..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && generateRoadmap()}
                  />
                </div>
                <button
                  onClick={generateRoadmap}
                  disabled={isLoading || isLoadingData || !dreamOccupation.trim() || !process.env.REACT_APP_GEMINI_API_KEY}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Generating...' : isLoadingData ? 'Loading Data...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
          {/* Error Display */}
          {error && (
            <div className="max-w-2xl mx-auto mb-6">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          )}
          {/* Roadmap Display */}
          {roadmap && (
            <div className="max-w-6xl mx-auto">
              {/* Progress Header */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center gap-4">
                  {React.createElement(occupationIcons[roadmap.occupation.toLowerCase() as keyof typeof occupationIcons] || BookOpen, {
                    className: "h-8 w-8 text-blue-600"
                  })}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {roadmap.title} Roadmap
                    </h2>
                    <p className="text-gray-600">Click on a subject to view details</p>
                  </div>
                </div>
              </div>
              {/* Flowchart */}
              <RoadmapFlowchart roadmap={roadmap} onNodeClick={handleNodeClick} selectedNodeId={selectedNodeId} />
            </div>
          )}
          {/* Sample Occupations */}
          {!roadmap && (
            <div className="max-w-2xl mx-auto mt-12">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                Try these sample occupations:
              </h3>
              <div className="grid gap-3 md:grid-cols-4">
                {Object.keys(occupationIcons).map((occupation) => (
                  <button
                    key={occupation}
                    onClick={() => {
                      setDreamOccupation(occupation);
                      setTimeout(() => generateRoadmap(), 100);
                    }}
                    className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {React.createElement(occupationIcons[occupation as keyof typeof occupationIcons], {
                        className: "h-6 w-6 text-blue-600"
                      })}
                      <span className="font-medium text-gray-800 capitalize">
                        {occupation}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Subject Details Panel */}
      <SubjectDetailsPanel subject={selectedSubject} onClose={() => { setSelectedSubject(null); setSelectedNodeId(null); }} />
    </div>
  );
}

export default CourseRoadmapTool;