"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const RATE_LIMIT_DELAY_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Call backend Browser Use API to scrape startup data
export const scrapeStartupData = action({
  args: { startupName: v.string(), debug: v.optional(v.boolean()) },
  handler: async (_ctx, args) => {
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    const apiKey = process.env.BACKEND_API_KEY;

    if (!apiKey) {
      throw new Error("BACKEND_API_KEY not configured");
    }

    console.log(`[scrapeStartupData] Starting full-analysis for: ${args.startupName} (async mode)`);

    // CONVEX_SITE_URL is a built-in environment variable
    const convexSiteUrl = process.env.CONVEX_SITE_URL;
    const callbackUrl = `${convexSiteUrl}/full-analysis-callback`;

    try {
      // Call backend with callback URL - don't await, let it process asynchronously
      fetch(`${backendUrl}/api/full-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          company_name: args.startupName,
          debug: args.debug || false,
          callback_url: callbackUrl,
        }),
      }).catch((error) => {
        console.error(`[scrapeStartupData] Failed to trigger async full analysis:`, error);
      });

      console.log(`[scrapeStartupData] Triggered async full analysis with callback to ${callbackUrl}`);

      // Return immediately - the backend will call us back when done
      return {
        success: true,
        message: "Analysis started. Results will be available shortly.",
        async: true
      };
    } catch (error) {
      console.error(`[scrapeStartupData] Error for ${args.startupName}:`, error);
      throw error;
    }
  },
});

// Analyze with AI using Cerebras API
export const analyzeWithCerebras = action({
  args: {
    startupName: v.string(),
    agentId: v.string(),
    agentName: v.string(),
    agentPrompt: v.string(),
    scrapedData: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`[analyzeWithCerebras] Starting analysis for ${args.startupName} with agent: ${args.agentName}`);

    // Create analysis record with loading status
    const analysisId = await ctx.runMutation(api.mutations.createAnalysis, {
      startupName: args.startupName,
      agentId: args.agentId,
      agentName: args.agentName,
    });

    try {
      // Call Cerebras API
      const cerebrasApiKey = process.env.CEREBRAS_API_KEY;
      if (!cerebrasApiKey) {
        throw new Error("CEREBRAS_API_KEY not configured");
      }

      console.log(`[analyzeWithCerebras] Calling Cerebras API for ${args.agentName}`);
      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cerebrasApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b",
          messages: [
            {
              role: "system",
              content: `${args.agentPrompt}\n\nIMPORTANT: DO NOT confuse this company with another company. This company should in no case be referred to as another company - it is its own distinct company with this specific name.\n\nIMPORTANT: Format your entire response using Markdown with these requirements:\n- Use headers (##, ###), bold (**text**), italic (*text*), bullet points (- item), numbered lists (1. item)\n- Use ONLY ONE newline between sections, never multiple blank lines\n- Keep formatting compact and dense\n- Do NOT add any introductory or explanatory text - start directly with your analysis\n- Example format:\n##SECTION\nContent here.\n\n##NEXT SECTION\nMore content.`,
            },
            {
              role: "user",
              content: `Here is the startup data gathered from web research:\n\n${args.scrapedData}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      console.log(`[analyzeWithCerebras] Cerebras API response status: ${response.status} for ${args.agentName}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[analyzeWithCerebras] Cerebras API error for ${args.agentName}: ${response.status} - ${errorText}`);
        throw new Error(`Cerebras API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const analysis = data.choices[0]?.message?.content || "No analysis available";

      console.log(`[analyzeWithCerebras] Analysis completed for ${args.agentName}, length: ${analysis.length} chars`);

      // Update analysis with result
      await ctx.runMutation(api.mutations.updateAnalysis, {
        analysisId,
        analysis,
        status: "completed",
      });

      return analysis;
    } catch (error) {
      console.error(`[analyzeWithCerebras] Error for ${args.agentName}:`, error);
      // Update analysis with error
      await ctx.runMutation(api.mutations.updateAnalysis, {
        analysisId,
        analysis: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        status: "error",
      });
      throw error;
    }
  },
});

// Action to run deep research (founders + competitors)
export const runDeepResearch = action({
  args: { startupName: v.string() },
  handler: async (ctx, args) => {
    console.log(`[runDeepResearch] Starting deep research for: ${args.startupName}`);
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    const apiKey = process.env.BACKEND_API_KEY;

    if (!apiKey) {
      throw new Error("BACKEND_API_KEY not configured");
    }

    try {
      // Get the current scraped data to extract founder names
      const scrapedData = await ctx.runQuery(api.queries.getScrapedData, {
        startupName: args.startupName,
      });

      if (!scrapedData?.data) {
        throw new Error("No scraped data available. Please run initial analysis first.");
      }

      const parsedData = JSON.parse(scrapedData.data);
      const founders = parsedData.founders || [];

      console.log(`[runDeepResearch] Found ${founders.length} founders`);

      if (founders.length === 0) {
        throw new Error("No founders found. Cannot run deep research.");
      }

      // Check if deep research has already been run
      const hasCompetitors = parsedData.competitors && parsedData.competitors.length > 0;
      const foundersAlreadyEnriched = founders.every((f: any) => f.bio && f.bio !== "None");

      if (hasCompetitors && foundersAlreadyEnriched) {
        console.log("[runDeepResearch] Deep research already completed, skipping");
        return { success: true, message: "Deep research already completed" };
      }

      console.log(`[runDeepResearch] Calling /api/deep-research endpoint (async mode)`);

      // CONVEX_SITE_URL is a built-in environment variable
      const convexSiteUrl = process.env.CONVEX_SITE_URL;
      const callbackUrl = `${convexSiteUrl}/deep-research-callback`;

      // Call backend deep-research endpoint with callback URL
      // Don't await - let it run asynchronously and call us back when done
      fetch(`${backendUrl}/api/deep-research`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          company_name: args.startupName,
          company_bio: parsedData.companyBio || parsedData.company_bio || null,
          company_website: parsedData.companyWebsite || parsedData.company_website || null,
          callback_url: callbackUrl,
          founders: {
            founders: founders.map((f: any) => ({
              name: f.name,
              social_media: {
                linkedin: f.linkedin || "None",
                X: f.twitter || "None",
                other: "None",
              },
              personal_website: f.personalWebsite || "None",
              bio: f.bio || "None",
            })),
          },
        }),
      }).catch((error) => {
        console.error(`[runDeepResearch] Failed to trigger async deep research:`, error);
      });

      console.log(`[runDeepResearch] Triggered async deep research with callback to ${callbackUrl}`);

      // Return immediately - the backend will call us back when done
      return {
        success: true,
        message: "Deep research started. Results will be available shortly.",
        async: true
      };
    } catch (error) {
      console.error(`[runDeepResearch] Error for ${args.startupName}:`, error);
      throw error;
    }
  },
});

// Action to enrich founder information by calling the backend research_founders endpoint
export const enrichFounderInfo = action({
  args: { startupName: v.string() },
  handler: async (ctx, args) => {
    console.log(`[enrichFounderInfo] Starting founder enrichment for: ${args.startupName}`);
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    const apiKey = process.env.BACKEND_API_KEY;

    if (!apiKey) {
      throw new Error("BACKEND_API_KEY not configured");
    }

    try {
      // Get the current scraped data to extract founder names
      const scrapedData = await ctx.runQuery(api.queries.getScrapedData, {
        startupName: args.startupName,
      });

      if (!scrapedData?.data) {
        throw new Error("No scraped data available");
      }

      const parsedData = JSON.parse(scrapedData.data);
      const founders = parsedData.founders || [];

      console.log(`[enrichFounderInfo] Found ${founders.length} founders`);

      if (founders.length === 0) {
        console.log("[enrichFounderInfo] No founders to enrich");
        return;
      }

      // Check if founders are already enriched (have bios)
      const foundersAlreadyEnriched = founders.every((f: any) => f.bio && f.bio !== "None");
      if (foundersAlreadyEnriched) {
        console.log("[enrichFounderInfo] Founders already enriched, skipping research");
        return { success: true, enrichedFounders: founders };
      }

      console.log(`[enrichFounderInfo] Calling /api/research-founders endpoint`);
      // Call backend to research founders
      const response = await fetch(`${backendUrl}/api/research-founders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          company_name: args.startupName,
          founders: {
            founders: founders.map((f: any) => ({
              name: f.name,
              social_media: {
                linkedin: f.linkedin || "None",
                X: f.twitter || "None",
                other: "None",
              },
              personal_website: f.personalWebsite || "None",
              bio: f.bio || "None",
            })),
          },
        }),
      });

      console.log(`[enrichFounderInfo] API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[enrichFounderInfo] API error: ${response.status} - ${errorText}`);
        throw new Error(`Backend API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        console.error(`[enrichFounderInfo] Backend returned success=false or no data:`, result);
        console.log(`[enrichFounderInfo] Skipping founder enrichment - will use basic founder info`);
        return { success: false, message: "Founder enrichment unavailable" };
      }

      console.log(`[enrichFounderInfo] Successfully enriched founder data`);

      // Update the scraped data with enriched founder info
      const enrichedFounders = result.data.founders.map((f: any) => ({
        name: f.name,
        linkedin: f.social_media?.linkedin,
        twitter: f.social_media?.X,
        personalWebsite: f.personal_website,
        bio: f.bio,
      }));

      console.log(`[enrichFounderInfo] Enriched ${enrichedFounders.length} founders`);

      const updatedScrapedData = {
        ...parsedData,
        founders: enrichedFounders,
      };

      // Store the updated scraped data
      console.log(`[enrichFounderInfo] Storing updated scraped data`);
      await ctx.runMutation(api.mutations.storeScrapedData, {
        startupName: args.startupName,
        data: JSON.stringify(updatedScrapedData),
      });

      const updatedScrapedDataString = JSON.stringify(updatedScrapedData);

      // Get active agents to re-analyze with enriched data
      const activeAgents = await ctx.runQuery(api.queries.getActiveAgents);
      console.log(`[enrichFounderInfo] Re-analyzing with ${activeAgents.length} agents`);

      // Re-run all agent analyses with the enriched founder data
      for (const [index, agent] of activeAgents.entries()) {
        try {
          await ctx.runAction(api.actions.analyzeWithCerebras, {
            startupName: args.startupName,
            agentId: agent.agentId,
            agentName: agent.name,
            agentPrompt: agent.prompt,
            scrapedData: updatedScrapedDataString,
          });
        } finally {
          if (index < activeAgents.length - 1) {
            await sleep(RATE_LIMIT_DELAY_MS);
          }
        }
      }

      // Regenerate summaries with enriched data
      console.log(`[enrichFounderInfo] Regenerating summaries`);

      await ctx.runAction(api.actions.generateSummaries, {
        startupName: args.startupName,
        scrapedData: updatedScrapedDataString,
      });

      console.log(`[enrichFounderInfo] Completed successfully for ${args.startupName}`);
      return { success: true, enrichedFounders };
    } catch (error) {
      console.error(`[enrichFounderInfo] Error for ${args.startupName}:`, error);
      throw error;
    }
  },
});

// Action to analyze a single agent for a startup (when agent is added later)
export const analyzeSingleAgent = action({
  args: {
    startupName: v.string(),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get the scraped data
      const scrapedData = await ctx.runQuery(api.queries.getScrapedData, {
        startupName: args.startupName,
      });

      if (!scrapedData?.data) {
        throw new Error("No scraped data available for this startup. Please run a full analysis first.");
      }

      // Get the agent details
      const agents = await ctx.runQuery(api.queries.getAgents);
      const agent = agents.find((a: any) => a.agentId === args.agentId);

      if (!agent) {
        throw new Error(`Agent ${args.agentId} not found`);
      }

      // Run the analysis for this single agent
      await ctx.runAction(api.actions.analyzeWithCerebras, {
        startupName: args.startupName,
        agentId: agent.agentId,
        agentName: agent.name,
        agentPrompt: agent.prompt,
        scrapedData: scrapedData.data,
      });

      return { success: true };
    } catch (error) {
      console.error("Error in analyzeSingleAgent:", error);
      throw error;
    }
  },
});

// Rerun analysis for a cached company (forces fresh data scraping)
export const rerunAnalysis = action({
  args: { startupName: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    console.log(`[rerunAnalysis] Starting rerun for: ${args.startupName}`);

    // Always scrape fresh data for rerun
    console.log(`[rerunAnalysis] Force re-scraping fresh data for ${args.startupName}`);
    const scrapedData = await ctx.runAction(api.actions.scrapeStartupData, {
      startupName: args.startupName,
      debug: false,
    });
    const scrapedDataString = JSON.stringify(scrapedData);

    // Store the fresh scraped data
    console.log(`[rerunAnalysis] Storing fresh scraped data`);
    await ctx.runMutation(api.mutations.storeScrapedData, {
      startupName: args.startupName,
      data: scrapedDataString,
    });

    // Get active agents
    let dbAgents = await ctx.runQuery(api.queries.getActiveAgents);

    if (dbAgents.length === 0) {
      console.log(`[rerunAnalysis] No agents found, initializing defaults`);
      await ctx.runMutation(api.mutations.initializeMyAgents);
      dbAgents = await ctx.runQuery(api.queries.getActiveAgents);
    }

    console.log(`[rerunAnalysis] Re-running analyses with ${dbAgents.length} agents`);
    // Re-run all agent analyses with fresh data
    for (const [index, agent] of dbAgents.entries()) {
      try {
        await ctx.runAction(api.actions.analyzeWithCerebras, {
          startupName: args.startupName,
          agentId: agent.agentId,
          agentName: agent.name,
          agentPrompt: agent.prompt,
          scrapedData: scrapedDataString,
        });
      } finally {
        if (index < dbAgents.length - 1) {
          await sleep(RATE_LIMIT_DELAY_MS);
        }
      }
    }

    // Regenerate summaries with fresh data
    console.log(`[rerunAnalysis] Regenerating summaries`);
    await ctx.runAction(api.actions.generateSummaries, {
      startupName: args.startupName,
      scrapedData: scrapedDataString,
    });

    console.log(`[rerunAnalysis] Completed successfully for ${args.startupName}`);
    return { success: true };
  },
});

// Orchestrator action to run all analyses
export const analyzeStartup = action({
  args: { startupName: v.string(), debug: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    try {
      // Initialize agents if they don't exist
      const dbAgents = await ctx.runQuery(api.queries.getActiveAgents);
      if (dbAgents.length === 0) {
        await ctx.runMutation(api.mutations.initializeMyAgents);
      }

      // Trigger async scraping - the webhook will handle agent analyses when data arrives
      await ctx.runAction(api.actions.scrapeStartupData, {
        startupName: args.startupName,
        debug: args.debug,
      });

      return { success: true, async: true };
    } catch (error) {
      console.error("Error in analyzeStartup:", error);
      if (error instanceof Error && error.message.includes("must be authenticated")) {
        throw new Error("You must be signed in to analyze startups.");
      }
      throw error;
    }
  },
});

// Generate summary cards
export const generateSummaries = action({
  args: {
    startupName: v.string(),
    scrapedData: v.string(),
  },
  handler: async (ctx, args) => {
    const cerebrasApiKey = process.env.CEREBRAS_API_KEY;
    if (!cerebrasApiKey) {
      return;
    }

    // Parse scraped data to extract rich information
    const scrapedData = JSON.parse(args.scrapedData);

    // For founder_story, use the actual founder bios if available
    const founders = scrapedData.founders || [];
    const founderBios = founders
      .map((f: any) => `${f.name}: ${f.bio || 'Bio not available'}`)
      .join('\n');

    // Only generate founder_story if we have founder information
    const hasFounderInfo = founders.length > 0 && founderBios.trim().length > 0;

    const summaryTypes = [
      ...(hasFounderInfo ? [{
        type: "founder_story",
        prompt: `Based on the following founder information, create a brief, compelling summary of the founders' background and how they came together to start this company. Focus on their unique experiences and complementary skills. 2-3 sentences max.\n\nIMPORTANT: Always create a positive, insightful summary even if biographical information is limited - focus on the team and their potential. If you truly cannot create any summary at all, respond with exactly the word "None" and nothing else. Do NOT return empty strings, quotes, or apologetic messages like "detailed biographies are not available" or "unfortunately". Be confident and forward-looking.\n\nFounder Information:\n${founderBios}`,
        useDirectData: true,
      }] : []),
      {
        type: "market_position",
        prompt: "Summarize the company's position in the competitive landscape and their unique differentiation. 2-3 sentences max.",
        useDirectData: false,
      },
      {
        type: "funding_outlook",
        prompt: "Provide an assessment of their current funding stage and what they likely need next. 2-3 sentences max.",
        useDirectData: false,
      },
      {
        type: "company_overview",
        prompt: `Based on this company data, provide a tight, 2 sentence summary that highlights what they do, who they serve, and why they matter right now.\n\nCompany Bio: ${scrapedData.bio || ''}\nCompany Summary: ${scrapedData.summary || ''}`,
        useDirectData: true,
      },
    ];

    for (const summary of summaryTypes) {
      try {
        const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cerebrasApiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b",
            messages: [
              {
                role: "system",
                content: `${summary.prompt}\n\nIMPORTANT: DO NOT confuse this company with another company. This company should in no case be referred to as another company - it is its own distinct company with this specific name.`,
              },
              {
                role: "user",
                content: summary.useDirectData
                  ? "Generate the summary based on the information in the system prompt."
                  : `Startup data:\n\n${args.scrapedData}`,
              },
            ],
            temperature: 0.7,
            max_tokens: 200,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          let content = data.choices[0]?.message?.content || "";

          // Clean up content - if it's empty, just quotes, whitespace, or apologetic, set to "None"
          content = content.trim();
          const contentLower = content.toLowerCase();
          if (
            content === "" ||
            content === '""' ||
            content === "''" ||
            contentLower.includes("although detailed biographies") ||
            contentLower.includes("unfortunately") ||
            (contentLower.includes("not available") && contentLower.includes("biograph"))
          ) {
            content = "None";
          }

          await ctx.runMutation(api.mutations.createSummary, {
            startupName: args.startupName,
            summaryType: summary.type,
            content,
          });
        }
      } catch (error) {
        console.error(`Error generating summary ${summary.type}:`, error);
      }
    }
  },
});
