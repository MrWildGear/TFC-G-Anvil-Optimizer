// Enum representing various actions that can be applied in the anvil optimization process.
// Each action has a unique effect on position.
enum Action {
    Punch = 2,
    Bend = 7,
    Upset = 13,
    Shrink = 16,
    LightHit = -3,
    MediumHit = -6,
    HeavyHit = -9,
    Draw = -15,
    AnyHit = 0, // Placeholder that dynamically selects the best "hit" action based on the position delta.
    Any = -1 // Placeholder that dynamically selects the best possible action to get closer to the goal position.
}

// Interface defining the result structure for a crafting optimization.
interface CraftingResult {
    optimalSequence: Action[]; // Array of actions that form the optimal path to the goal.
    finalPosition: number; // Final position after applying all actions in optimalSequence and endSequence.
    endSequence: Action[]; // The sequence specified by the user to be the ending actions.
}

class AnvilOptimizer {
    // Constants defining the minimum and maximum bounds for position on the anvil.
    private static readonly ANVIL_MIN = 1;
    private static readonly ANVIL_MAX = 150;

    /**
     * Main function to calculate the optimal sequence of actions to reach the goal position.
     * @param goalPosition - The target position the user wants to achieve.
     * @param endSequence - A user-specified sequence of actions that must occur at the end.
     * @returns A CraftingResult object containing the optimal sequence and final position.
     */
    static optimizeCrafting(goalPosition: number, endSequence: Action[]): CraftingResult {
        // Adjust goalPosition by 1 for internal calculation.
        goalPosition += 1;
        
        // Calculate the cumulative effect of the end sequence on position.
        const endSequenceDelta = this.calculateSequenceDelta(endSequence);
        const preEndSequencePosition = goalPosition - endSequenceDelta;

        // If the target position is outside valid bounds, throw an error.
        if (preEndSequencePosition < this.ANVIL_MIN || preEndSequencePosition > this.ANVIL_MAX) {
            throw new Error("Invalid goal position or end sequence");
        }

        // Find the optimal sequence to reach the position before the end sequence.
        const optimalActions = this.findOptimalTraversal(this.ANVIL_MIN, preEndSequencePosition);
        return {
            optimalSequence: optimalActions,
            finalPosition: goalPosition,
            endSequence: endSequence
        };
    }

    /**
     * Helper function to calculate the shortest sequence of actions to reach a target position.
     * Uses recursion to try all possible action paths.
     * @param start - Starting position (typically the minimum position).
     * @param end - Target position to reach.
     * @returns An array of actions forming the optimal sequence to reach the target position.
     */
    private static findOptimalTraversal(start: number, end: number): Action[] {
        // Calculate the position change required.
        const delta = end - start;
        // Filter to get all valid action values except placeholders.
        const actions = Object.values(Action).filter(a => typeof a === 'number' && a !== 0) as Action[];

        let bestSequence: Action[] = []; // Stores the best sequence of actions found.
        let minSteps = Infinity; // Tracks the minimum steps required to reach the target.

        // Recursive helper function to find the sequence.
        const findSequence = (remaining: number, currentSequence: Action[]) => {
            // If exactly at the target position and with fewer steps, update best sequence.
            if (remaining === 0 && currentSequence.length < minSteps) {
                minSteps = currentSequence.length;
                bestSequence = [...currentSequence];
                return;
            }

            // Stop if the current path is already longer than the best path found.
            if (currentSequence.length >= minSteps) return;

            // Try each action in actions array.
            for (const action of actions) {
                if (action === Action.AnyHit) {
                    // For "AnyHit", dynamically select the best "hit" action.
                    const bestHit = this.getBestHit(remaining);
                    if (Math.abs(remaining - bestHit) <= Math.abs(remaining)) {
                        findSequence(remaining - bestHit, [...currentSequence, bestHit]);
                    }
                } else if (action === Action.Any) {
                    // For "Any", try each possible action to get closer to the target.
                    for (const possibleAction of actions) {
                        if (possibleAction !== Action.Any && possibleAction !== Action.AnyHit) {
                            if (Math.abs(remaining - possibleAction) <= Math.abs(remaining)) {
                                findSequence(remaining - possibleAction, [...currentSequence, Action.Any]);
                            }
                        }
                    }
                } else if (Math.abs(remaining - action) <= Math.abs(remaining)) {
                    // For regular actions, check if they bring the position closer to the target.
                    findSequence(remaining - action, [...currentSequence, action]);
                }
            }
        };

        // Start recursion with the initial delta and an empty sequence.
        findSequence(delta, []);
        return bestSequence;
    }

    /**
     * Determines the best "hit" action (LightHit, MediumHit, HeavyHit) based on the position delta.
     * @param delta - The remaining position change required.
     * @returns The action that most closely reduces the position change to zero.
     */
    public static getBestHit(delta: number): Action {
        const hits = [Action.LightHit, Action.MediumHit, Action.HeavyHit];
        return hits.reduce((best, current) => 
            Math.abs(current - delta) < Math.abs(best - delta) ? current : best
        );
    }

    /**
     * Calculates the cumulative position change resulting from a sequence of actions.
     * Dynamically selects best action for placeholders "AnyHit" and "Any" as it goes.
     * @param sequence - Array of actions to calculate the total effect.
     * @returns The total change in position after applying all actions in the sequence.
     */
    public static calculateSequenceDelta(sequence: Action[]): number {
        return sequence.reduce((sum, action) => {
            if (action === Action.AnyHit) {
                return sum + this.getBestHit(-sum);
            } else if (action === Action.Any) {
                // For "Any", calculate the best possible action at the current position.
                return sum + this.getBestAnyAction(-sum);
            }
            return sum + action;
        }, 0);
    }

    /**
     * For the "Any" placeholder, determines the best action to minimize position delta.
     * @param delta - The remaining position change required.
     * @returns The action that most effectively reduces the delta.
     */
    static getBestAnyAction(delta: number): Action {
        const possibleActions = Object.values(Action).filter(a => 
            typeof a === 'number' && a !== Action.AnyHit && a !== Action.Any
        ) as Action[];
        return possibleActions.reduce((best, current) => 
            Math.abs(current - delta) < Math.abs(best - delta) ? current : best
        );
    }
}

/**
 * Wrapper function for external calls to the optimizer, returning a result or error.
 * @param goalPosition - Target position for the crafting process.
 * @param endSequence - Desired ending sequence of actions.
 * @returns CraftingResult or error message if an error occurs.
 */
function optimizeAnvilCrafting(goalPosition: number, endSequence: Action[]): CraftingResult | string {
    try {
        return AnvilOptimizer.optimizeCrafting(goalPosition, endSequence);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return `Error: ${error.message}`;
        } else {
            return "An unknown error occurred";
        }
    }
}

// Export necessary items for usage in other modules or components.
export { Action, AnvilOptimizer, optimizeAnvilCrafting };
export type { CraftingResult };
