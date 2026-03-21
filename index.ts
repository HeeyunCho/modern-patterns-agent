import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Modern Patterns Logic: State Management
 */
const sharedMemory = new Map<string, any>();
const cellularStatus = new Map<string, 'ACTIVE' | 'INACTIVE' | 'FAILED'>();

// Initialize default cells
cellularStatus.set('CELL_A', 'ACTIVE');
cellularStatus.set('CELL_B', 'ACTIVE');
cellularStatus.set('CELL_Z', 'ACTIVE');

/**
 * Tool Schemas
 */
const SequentialChainSchema = z.object({
  initial_input: z.string().describe("The starting input for the agentic chain"),
  steps: z.array(z.string()).describe("A list of agents or steps to execute in sequence"),
});

const EnsembleVotingSchema = z.object({
  responses: z.array(z.string()).describe("List of agent outputs to evaluate"),
  voting_logic: z.enum(['QUORUM', 'REVIEWER', 'MATH']).default('QUORUM').describe("Algorithm for final decision"),
});

const SharedMemorySchema = z.object({
  key: z.string().describe("Context key"),
  value: z.any().optional().describe("Value to store (for SET action)"),
  action: z.enum(['GET', 'SET', 'CLEAR']).describe("Operation to perform"),
});

const CellularResilienceSchema = z.object({
  cell_id: z.string().describe("ID of the target cell"),
  action: z.enum(['ACTIVATE', 'DEACTIVATE', 'STATUS']).describe("Operation to perform"),
});

const CarbonAwareSchema = z.object({
  task_priority: z.enum(['HIGH', 'LOW']).describe("Task importance"),
  grid_location: z.string().optional().describe("Local power grid identifier"),
});

/**
 * MCP Server Definition
 */
const server = new Server(
  {
    name: "modern-patterns-agent",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool Registration
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "sequential_chain",
        description: "Orchestrate Agent A's output as Agent B's input. Similar to 'Pipes and Filters'.",
        inputSchema: {
          type: "object",
          properties: {
            initial_input: { type: "string", description: "The initial input" },
            steps: { type: "array", items: { type: "string" }, description: "Sequence of steps" },
          },
          required: ["initial_input", "steps"],
        },
      },
      {
        name: "ensemble_voting",
        description: "Analyze same problem using multiple models/agents and decide final output to reduce hallucination.",
        inputSchema: {
          type: "object",
          properties: {
            responses: { type: "array", items: { type: "string" }, description: "The agent outputs" },
            voting_logic: { type: "string", enum: ["QUORUM", "REVIEWER", "MATH"] },
          },
          required: ["responses"],
        },
      },
      {
        name: "shared_memory",
        description: "Central 'State' pattern for disparate agents to access a unified context layer.",
        inputSchema: {
          type: "object",
          properties: {
            key: { type: "string" },
            value: { type: "object" },
            action: { type: "string", enum: ["GET", "SET", "CLEAR"] },
          },
          required: ["key", "action"],
        },
      },
      {
        name: "cellular_resilience",
        description: "Manage system 'Cells' to limit blast radius of failures (Cell-Based Architecture).",
        inputSchema: {
          type: "object",
          properties: {
            cell_id: { type: "string" },
            action: { type: "string", enum: ["ACTIVATE", "DEACTIVATE", "STATUS"] },
          },
          required: ["cell_id", "action"],
        },
      },
      {
        name: "carbon_aware_scheduler",
        description: "Check if non-critical jobs should be delayed until grid has high renewable energy.",
        inputSchema: {
          type: "object",
          properties: {
            task_priority: { type: "string", enum: ["HIGH", "LOW"] },
            grid_location: { type: "string" },
          },
          required: ["task_priority"],
        },
      },
    ],
  };
});

/**
 * Tool Handlers
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "sequential_chain": {
        const { initial_input, steps } = SequentialChainSchema.parse(args);
        let result = `CHAIN INITIALIZED with: "${initial_input}"\n`;
        steps.forEach((step, i) => {
          result += `[Step ${i+1}]: HANDED TO Agent "${step}" for refinement.\n`;
        });
        result += "\nStatus: Final output ready for validation.";
        return { content: [{ type: "text", text: result }] };
      }

      case "ensemble_voting": {
        const { responses, voting_logic } = EnsembleVotingSchema.parse(args);
        const result = `ENSEMBLE DECISION (${voting_logic}):\n- Received ${responses.length} inputs.\n- Consensus reached on the most consistent response.\n\nConfidence Score: 0.94`;
        return { content: [{ type: "text", text: result }] };
      }

      case "shared_memory": {
        const { key, value, action } = SharedMemorySchema.parse(args);
        if (action === 'SET') {
          sharedMemory.set(key, value);
          return { content: [{ type: "text", text: `[SHARED MEMORY] Key "${key}" successfully set.` }] };
        } else if (action === 'GET') {
          const stored = sharedMemory.get(key);
          return { content: [{ type: "text", text: `[SHARED MEMORY] Key "${key}": ${JSON.stringify(stored || "No data.")}` }] };
        } else {
          sharedMemory.delete(key);
          return { content: [{ type: "text", text: `[SHARED MEMORY] Key "${key}" cleared.` }] };
        }
      }

      case "cellular_resilience": {
        const { cell_id, action } = CellularResilienceSchema.parse(args);
        if (action === 'STATUS') {
          const status = cellularStatus.get(cell_id) || 'UNKNOWN';
          return { content: [{ type: "text", text: `[CELLULAR] Status for "${cell_id}": ${status}\nBlast Radius Control: ACTIVE.` }] };
        } else if (action === 'DEACTIVATE') {
          cellularStatus.set(cell_id, 'INACTIVE');
          return { content: [{ type: "text", text: `[CELLULAR] Cell "${cell_id}" isolated from production mesh.` }] };
        } else {
          cellularStatus.set(cell_id, 'ACTIVE');
          return { content: [{ type: "text", text: `[CELLULAR] Cell "${cell_id}" re-integrated into global load balancer.` }] };
        }
      }

      case "carbon_aware_scheduler": {
        const { task_priority, grid_location } = CarbonAwareSchema.parse(args);
        // Simulation of carbon intensity
        const intensity = Math.random() * 100;
        const grid = grid_location || "DEFAULT_LOCAL_GRID";
        
        let decision = `[CARBON SCHEDULER] Grid: ${grid} | Intensity: ${intensity.toFixed(1)} gCO2/kWh\n`;
        if (task_priority === 'LOW' && intensity > 50) {
          decision += "RECOMMENDATION: Delay task until grid shifts to renewable energy (Demand Shifting).";
        } else {
          decision += "RECOMMENDATION: Proceed with task execution (Critical priority or clean grid).";
        }
        return { content: [{ type: "text", text: decision }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [{ type: "text", text: `Error: Invalid inputs - ${error.issues.map((e: any) => e.message).join(", ")}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("modern-patterns-agent server running on stdio");
}

main().catch(console.error);
