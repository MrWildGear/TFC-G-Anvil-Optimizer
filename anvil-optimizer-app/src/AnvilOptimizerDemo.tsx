import React, { useState, useEffect } from 'react';
import { Action, optimizeAnvilCrafting, CraftingResult, AnvilOptimizer } from './AnvilOptimizer';
import { useTheme } from './ThemeContext';

interface SavedOptimization {
    id: string; // Unique identifier for each saved optimization
    name: string; // Name given to the optimization by the user
    goalPosition: number; // Target position for the optimization
    endSequence: string[]; // Sequence of actions specified by the user to finalize the crafting
    result: { // Result of the optimization
        optimalSequence: string[]; // Calculated optimal sequence of actions
        finalPosition: number; // Final position after performing all actions
        endSequence: string[]; // End sequence specified by the user
    };
    timestamp: number; // Timestamp when the optimization was saved
}

const AnvilOptimizerDemo: React.FC = () => {
    const [goalPosition, setGoalPosition] = useState(57); // Target goal position
    const [endSequence, setEndSequence] = useState<Action[]>([Action.AnyHit, Action.AnyHit, Action.AnyHit]); // End sequence actions
    const [result, setResult] = useState<string>(''); // Result of optimization displayed to the user
    const [optimizationName, setOptimizationName] = useState(''); // Name input by the user for the optimization
    const [savedOptimizations, setSavedOptimizations] = useState<SavedOptimization[]>([]); // List of saved optimizations
    const [editingId, setEditingId] = useState<string | null>(null); // ID of the optimization currently being edited
    const [editingName, setEditingName] = useState(''); // Name being edited
    const { theme, toggleTheme } = useTheme(); // Theme context for dark/light mode
    const [sortBy, setSortBy] = useState<'name' | 'time_asc' | 'time_desc'>('name'); // Sorting criteria with options for name and time
    const [searchTerm, setSearchTerm] = useState(''); // Search term for filtering optimizations

    useEffect(() => {
        const saved = localStorage.getItem('savedOptimizations');
        if (saved) {
            setSavedOptimizations(JSON.parse(saved));
        }
    }, []);

    // Filter saved optimizations based on search term and sort by name or time
    const filteredAndSortedOptimizations = savedOptimizations
        .filter(opt => 
            opt.name && opt.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else if (sortBy === 'time_asc') {
                return a.timestamp - b.timestamp; // Sort by time in ascending order
            } else if (sortBy === 'time_desc') {
                return b.timestamp - a.timestamp; // Sort by time in descending order
            }
            return 0;
        });

    const handleOptimize = () => {
        const optimizationResult = optimizeAnvilCrafting(goalPosition, endSequence);

        if (typeof optimizationResult === 'string') {
            setResult(optimizationResult); // Display error message
        } else {
            let resultString = `Goal Position: ${goalPosition + 1}\n`;
            resultString += "Optimal action sequence:\n";
            optimizationResult.optimalSequence.forEach((action) => {
                resultString += `${Action[action]}\n`;
            });
            resultString += "--- End Sequence ---\n";
            optimizationResult.endSequence.forEach((action) => {
                if (action === Action.AnyHit) {
                    const bestHit = AnvilOptimizer['getBestHit'](-AnvilOptimizer['calculateSequenceDelta'](optimizationResult.endSequence.slice(0, optimizationResult.endSequence.indexOf(Action.AnyHit))));
                    resultString += `${Action[bestHit]} (AnyHit)\n`;
                } else {
                    resultString += `${Action[action]}\n`;
                }
            });
            resultString += `Final position: ${optimizationResult.finalPosition}`;
            setResult(resultString); // Display formatted result

            if (optimizationName) {
                const newSavedOptimization: SavedOptimization = {
                    id: Date.now().toString(),
                    name: optimizationName,
                    goalPosition,
                    endSequence: endSequence.map(action => Action[action]),
                    result: {
                        optimalSequence: optimizationResult.optimalSequence.map(action => Action[action]),
                        finalPosition: optimizationResult.finalPosition,
                        endSequence: optimizationResult.endSequence.map(action => Action[action])
                    },
                    timestamp: Date.now() // Store the current time as the timestamp
                };
                const updatedSavedOptimizations = [...savedOptimizations, newSavedOptimization];
                setSavedOptimizations(updatedSavedOptimizations);
                localStorage.setItem('savedOptimizations', JSON.stringify(updatedSavedOptimizations));
                setOptimizationName('');
            }
        }
    };

    const handleActionChange = (index: number, newAction: Action) => {
        const newEndSequence = [...endSequence];
        newEndSequence[index] = newAction;
        setEndSequence(newEndSequence);
    };

    const loadOptimization = (saved: SavedOptimization) => {
        setGoalPosition(saved.goalPosition);
        setEndSequence(saved.endSequence.map(actionString => Action[actionString as keyof typeof Action]));
        
        const loadedResult: CraftingResult = {
            optimalSequence: saved.result.optimalSequence.map(actionString => Action[actionString as keyof typeof Action]),
            finalPosition: saved.result.finalPosition,
            endSequence: saved.result.endSequence.map(actionString => Action[actionString as keyof typeof Action])
        };

        let resultString = `Goal Position: ${saved.goalPosition + 1}\n`;
        resultString += "Optimal action sequence:\n";
        loadedResult.optimalSequence.forEach((action) => {
            resultString += `${Action[action]}\n`;
        });
        resultString += "--- End Sequence ---\n";
        loadedResult.endSequence.forEach((action) => {
            if (action === Action.AnyHit) {
                const bestHit = AnvilOptimizer['getBestHit'](-AnvilOptimizer['calculateSequenceDelta'](loadedResult.endSequence.slice(0, loadedResult.endSequence.indexOf(Action.AnyHit))));
                resultString += `${Action[bestHit]} (AnyHit)\n`;
            } else {
                resultString += `${Action[action]}\n`;
            }
        });
        resultString += `Final position: ${loadedResult.finalPosition}`;
        setResult(resultString);
    };

    const startEditing = (id: string, name: string) => {
        setEditingId(id);
        setEditingName(name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingName('');
    };

    const saveEdit = (id: string) => {
        const updatedOptimizations = savedOptimizations.map(opt =>
            opt.id === id ? { ...opt, name: editingName } : opt
        );
        setSavedOptimizations(updatedOptimizations);
        localStorage.setItem('savedOptimizations', JSON.stringify(updatedOptimizations));
        setEditingId(null);
        setEditingName('');
    };

    const deleteOptimization = (id: string) => {
        const updatedOptimizations = savedOptimizations.filter(opt => opt.id !== id);
        setSavedOptimizations(updatedOptimizations);
        localStorage.setItem('savedOptimizations', JSON.stringify(updatedOptimizations));
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <h1>Anvil Optimizer Demo</h1>
            <button onClick={toggleTheme}>
                Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>

            {/* Form fields for optimization name and goal position */}
            <div>
              <br></br>
                <label>
                    Optimization Name:
                    <input
                        type="text"
                        value={optimizationName}
                        onChange={(e) => setOptimizationName(e.target.value)}
                    />
                </label>
            </div>
            <div>
              <br></br>
                <label>
                    Target:
                    <input
                        type="number"
                        value={goalPosition}
                        onChange={(e) => setGoalPosition(Number(e.target.value))}
                    />
                </label>
            </div>

            {/* End sequence selector */}
            <div>
                <h2>Final Sequence:</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    {endSequence.map((action, index) => (
                        <select
                            key={index}
                            value={action}
                            onChange={(e) => handleActionChange(index, Number(e.target.value) as Action)}
                        >
                            {Object.entries(Action).filter(([key, value]) => typeof value === 'number').map(([key, value]) => (
                                <option key={key} value={value}>
                                    {key}
                                </option>
                            ))}
                        </select>
                    ))}
                </div>
            </div>

            <button onClick={handleOptimize}>Optimize</button>
            <pre style={{ textAlign: 'center', maxWidth: '600px', margin: '20px auto' }}>{result}</pre>

            {/* Saved optimizations section */}
            <h2>Saved Optimizations</h2>
            <div>
                <label>Sort By:</label>
                <select onChange={(e) => setSortBy(e.target.value as 'name' | 'time_asc' | 'time_desc')}>
                    <option value="name">Name</option>
                    <option value="time_asc">Time Added (Ascending)</option>
                    <option value="time_desc">Time Added (Descending)</option>
                </select>
            </div>
            <div>
                <label>Search by Keyword:</label>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {filteredAndSortedOptimizations.map((saved) => (
                    <li key={saved.id} style={{ marginBottom: '10px' }}>
                        {editingId === saved.id ? (
                            <>
                                <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                />
                                <button onClick={() => saveEdit(saved.id)}>Save</button>
                                <button onClick={cancelEditing}>Cancel</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => loadOptimization(saved)}>{saved.name}</button>
                                <button onClick={() => startEditing(saved.id, saved.name)}>Rename</button>
                                <button onClick={() => deleteOptimization(saved.id)}>Delete</button>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AnvilOptimizerDemo;
