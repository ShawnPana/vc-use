import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// Test endpoint to verify callback connectivity
http.route({
  path: "/test-callback",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    console.log(`[test-callback] Received test request`);
    const apiKey = request.headers.get("X-API-Key");
    console.log(`[test-callback] API key present: ${!!apiKey}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Callback endpoint is reachable",
      apiKeyReceived: !!apiKey
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Webhook endpoint for backend to push deep research results
http.route({
  path: "/deep-research-callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      console.log(`[deep-research-callback] ===== CALLBACK RECEIVED =====`);
      console.log(`[deep-research-callback] Request URL: ${request.url}`);
      console.log(`[deep-research-callback] Request method: ${request.method}`);

      const body = await request.json();
      const apiKey = request.headers.get("X-API-Key");

      console.log(`[deep-research-callback] Received callback request`);
      console.log(`[deep-research-callback] Received API key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING'}`);
      console.log(`[deep-research-callback] Expected API key: ${process.env.BACKEND_API_KEY ? process.env.BACKEND_API_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
      console.log(`[deep-research-callback] Body keys: ${Object.keys(body).join(', ')}`);

      // Verify API key
      if (apiKey !== process.env.BACKEND_API_KEY) {
        console.error(`[deep-research-callback] Unauthorized - invalid API key`);
        console.error(`[deep-research-callback] Keys match: ${apiKey === process.env.BACKEND_API_KEY}`);
        return new Response("Unauthorized", { status: 401 });
      }

      const { startupName, userId, founders, competitors } = body;

      if (!startupName) {
        console.error(`[deep-research-callback] Missing startupName`);
        return new Response("Missing startupName", { status: 400 });
      }

      if (!userId) {
        console.error(`[deep-research-callback] Missing userId`);
        return new Response("Missing userId", { status: 400 });
      }

      console.log(`[deep-research-callback] Processing data for ${startupName} (userId: ${userId})`);

      // Get current scraped data using internal query (no auth required)
      const scrapedData = await ctx.runQuery(internal.queries.getScrapedDataInternal, {
        userId,
        startupName,
      });

      let parsedData;
      if (!scrapedData?.data) {
        console.warn(`[deep-research-callback] No scraped data found for ${startupName} - will create minimal structure`);
        // Create minimal structure if no existing data
        parsedData = {
          companyBio: null,
          companyWebsite: null,
          company_bio: null,
          company_website: null,
          hype: null,
          founders: [],
          competitors: [],
        };
      } else {
        parsedData = JSON.parse(scrapedData.data);
      }
      console.log(`[deep-research-callback] Current data has ${parsedData.founders?.length || 0} founders, ${parsedData.competitors?.length || 0} competitors`);

      // Process founders and competitors from backend response
      const foundersArray = founders?.founders || founders || [];
      const competitorsArray = competitors?.competitors || competitors || [];

      console.log(`[deep-research-callback] Received ${foundersArray.length} founders, ${competitorsArray.length} competitors from backend`);

      // Map founders with enriched data
      const enrichedFounders = foundersArray.map((f: any) => ({
        name: f.name,
        linkedin: f.social_media?.linkedin,
        twitter: f.social_media?.X,
        personalWebsite: f.personal_website,
        bio: f.bio,
      }));

      // Map competitors
      const enrichedCompetitors = competitorsArray.map((c: any) => ({
        name: c.name,
        website: c.website,
        description: c.description,
      }));

      console.log(`[deep-research-callback] Enriched ${enrichedFounders.length} founders, ${enrichedCompetitors.length} competitors`);
      console.log(`[deep-research-callback] Sample founder bio length: ${enrichedFounders[0]?.bio?.length || 0} chars`);

      // Update scraped data with enriched founders and competitors
      const updatedScrapedData = {
        ...parsedData,
        founders: enrichedFounders,
        competitors: enrichedCompetitors,
      };

      // Store updated data using internal mutation
      console.log(`[deep-research-callback] Storing updated scraped data for ${startupName}`);
      await ctx.runMutation(internal.mutations.storeScrapedDataInternal, {
        userId,
        startupName,
        data: JSON.stringify(updatedScrapedData),
      });

      const updatedScrapedDataString = JSON.stringify(updatedScrapedData);

      // Get active agents to re-analyze with enriched data
      const activeAgents = await ctx.runQuery(api.queries.getActiveAgents);
      console.log(`[deep-research-callback] Re-analyzing with ${activeAgents.length} agents`);

      // Re-run all agent analyses with the enriched data
      const RATE_LIMIT_DELAY_MS = 500;
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      for (const [index, agent] of activeAgents.entries()) {
        console.log(`[deep-research-callback] Running agent ${index + 1}/${activeAgents.length}: ${agent.name}`);
        await ctx.runAction(api.actions.analyzeWithCerebras, {
          startupName,
          agentId: agent.agentId,
          agentName: agent.name,
          agentPrompt: agent.prompt,
          scrapedData: updatedScrapedDataString,
        });

        // Add delay between agents to avoid rate limits (except after last agent)
        if (index < activeAgents.length - 1) {
          await sleep(RATE_LIMIT_DELAY_MS);
        }
      }

      // Regenerate summaries with enriched data - this will now include founder_story and market_position
      console.log(`[deep-research-callback] Regenerating summaries with enriched data`);
      await ctx.runAction(api.actions.generateSummaries, {
        startupName,
        scrapedData: updatedScrapedDataString,
      });

      console.log(`[deep-research-callback] Successfully processed all data for ${startupName}`);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[deep-research-callback] Error:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
