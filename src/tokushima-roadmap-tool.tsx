import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Target, Zap, Wifi, CheckCircle, Circle, Brain, AlertCircle, Loader2 } from 'lucide-react';
import { geminiService, GeneratedRoadmap, Subject } from './services/geminiService';
import { dataService } from './services/dataService';

interface RoadmapFlowchartProps {
  roadmap: GeneratedRoadmap;
  onNodeClick: (node: any) => void;
}

function RoadmapFlowchart({ roadmap, onNodeClick }: RoadmapFlowchartProps) {
  // Sort nodes by year and semester
  const sortedNodes = [...(roadmap.nodes || [])].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.semester - b.semester;
  });

  // Auto-layout: assign x/y based on year/semester
  const yearCount = Math.max(...sortedNodes.map(n => n.year));
  const semestersPerYear = Math.max(...sortedNodes.map(n => n.semester));
  const yStep = 120;
  const xStep = 180;
  const nodePositions: { [id: string]: { x: number; y: number } } = {};
  let yearSemesterMap: { [key: string]: number } = {};

  sortedNodes.forEach((node) => {
    const y = 100 + (node.year - 1) * yStep;
    // For each year, spread semesters horizontally
    const key = `${node.year}-${node.semester}`;
    yearSemesterMap[key] = (yearSemesterMap[key] || 0) + 1;
    const x = 100 + (node.semester - 1) * xStep + (yearSemesterMap[key] - 1) * 30;
    nodePositions[node.id] = { x, y };
  });

  const getNodeColor = (node: any) => {
    if (node.completed) return 'bg-green-500 text-white border-green-600';
    
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
      
      <div className="relative" style={{ minHeight: `${yearCount * 140 + 100}px`, minWidth: `${semestersPerYear * 200 + 100}px` }}>
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
              {node.completed ? (
                <CheckCircle className="h-4 w-4 mr-1" />
              ) : (
                <Circle className="h-4 w-4 mr-1" />
              )}
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
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 border border-green-600 rounded"></div>
          <span>Completed</span>
        </div>
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
        setSubjects(allSubjects);
        
        // Temporarily disable career relevance update to focus on main functionality
        // TODO: Re-enable once main roadmap generation is working
        /*
        if (process.env.REACT_APP_GEMINI_API_KEY) {
          try {
            console.log('Updating career relevance scores...');
            const updatedSubjects = await geminiService.updateCareerRelevance(allSubjects);
            setSubjects(updatedSubjects);
            console.log('Career relevance scores updated successfully');
          } catch (relevanceError) {
            console.warn('Failed to update career relevance scores, using original data:', relevanceError);
            // Continue with original subjects if career relevance update fails
          }
        }
        */
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
      
      // Validate the generated roadmap
      if (!generatedRoadmap || !generatedRoadmap.nodes || !Array.isArray(generatedRoadmap.nodes)) {
        throw new Error('Invalid roadmap data received from AI');
      }
      
      setRoadmap(generatedRoadmap);
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
    setRoadmap(prev => {
      if (!prev) return null;
      return {
        ...prev,
        nodes: prev.nodes.map(n => 
          n.id === node.id ? { ...n, completed: !n.completed } : n
        )
      };
    });
  };

  const getCompletionStats = () => {
    if (!roadmap) return { completed: 0, total: 0, credits: 0 };
    const completed = roadmap.nodes.filter(n => n.completed).length;
    const completedCredits = roadmap.nodes
      .filter(n => n.completed)
      .reduce((sum, n) => sum + n.credits, 0);
    return { 
      completed, 
      total: roadmap.nodes.length, 
      credits: completedCredits,
      totalCredits: roadmap.total_credits
    };
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading syllabus data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {React.createElement(occupationIcons[roadmap.occupation.toLowerCase() as keyof typeof occupationIcons] || BookOpen, {
                    className: "h-8 w-8 text-blue-600"
                  })}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {roadmap.title} Roadmap
                    </h2>
                    <p className="text-gray-600">Click on subjects to mark as completed</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {getCompletionStats().completed}/{getCompletionStats().total}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                  <div className="text-sm text-gray-500">
                    {getCompletionStats().credits}/{getCompletionStats().totalCredits} credits
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(getCompletionStats().completed / getCompletionStats().total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Flowchart */}
            <RoadmapFlowchart roadmap={roadmap} onNodeClick={handleNodeClick} />
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
  );
}

export default CourseRoadmapTool;