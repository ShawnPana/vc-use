import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// Webhook endpoint for backend to push full-analysis results
http.route({
  path: "/full-analysis-callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const apiKey = request.headers.get("X-API-Key");

      // Verify API key
      if (apiKey !== process.env.BACKEND_API_KEY) {
        return new Response("Unauthorized", { status: 401 });
      }

      const { startupName, company, hype } = body;

      if (!startupName) {
        return new Response("Missing startupName", { status: 400 });
      }

      console.log(`[full-analysis-callback] Received data for ${startupName}`);

      // Format and store the scraped data
      const scrapedData = {
        startupName,
        website: company.company_website,
        bio: company.company_bio,
        summary: company.company_summary,
        founders: (company.founders_info?.founders || []).map((f: any) => ({
          name: f.name,
          linkedin: f.social_media?.linkedin,
          twitter: f.social_media?.X,
          personalWebsite: f.personal_website,
          bio: f.bio,
        })),
        hype: hype
          ? {
              summary: hype.hype_summary,
              numbers: hype.numbers,
              recentNews: hype.recent_news,
            }
          : null,
      };

      await ctx.runMutation(api.mutations.storeScrapedData, {
        startupName,
        data: JSON.stringify(scrapedData),
      });

      console.log(`[full-analysis-callback] Stored data, now triggering deep research for ${startupName}`);

      // Automatically trigger deep research with callback
      await ctx.runAction(api.actions.runDeepResearch, {
        startupName,
      });

      console.log(`[full-analysis-callback] Successfully processed data for ${startupName}`);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[full-analysis-callback] Error:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Webhook endpoint for backend to push deep research results
http.route({
  path: "/deep-research-callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const apiKey = request.headers.get("X-API-Key");

      // Verify API key
      if (apiKey !== process.env.BACKEND_API_KEY) {
        return new Response("Unauthorized", { status: 401 });
      }

      const { startupName, founders, competitors } = body;

      if (!startupName) {
        return new Response("Missing startupName", { status: 400 });
      }

      console.log(`[deep-research-callback] Received data for ${startupName}`);

      // Get current scraped data
      const scrapedData = await ctx.runQuery(api.queries.getScrapedData, {
        startupName,
      });

      if (!scrapedData?.data) {
        return new Response("No scraped data found", { status: 404 });
      }

      const parsedData = JSON.parse(scrapedData.data);

      // Process founders and competitors
      const foundersArray = founders?.founders || founders || [];
      const competitorsArray = competitors?.competitors || competitors || [];

      const enrichedFounders = foundersArray.map((f: any) => ({
        name: f.name,
        linkedin: f.social_media?.linkedin,
        twitter: f.social_media?.X,
        personalWebsite: f.personal_website,
        bio: f.bio,
      }));

      const enrichedCompetitors = competitorsArray.map((c: any) => ({
        name: c.name,
        website: c.website,
        description: c.description,
      }));

      console.log(`[deep-research-callback] Enriched ${enrichedFounders.length} founders, ${enrichedCompetitors.length} competitors`);

      // Store updated data
      const updatedScrapedData = {
        ...parsedData,
        founders: enrichedFounders,
        competitors: enrichedCompetitors,
      };

      await ctx.runMutation(api.mutations.storeScrapedData, {
        startupName,
        data: JSON.stringify(updatedScrapedData),
      });

      // Regenerate summaries
      await ctx.runAction(api.actions.generateSummaries, {
        startupName,
        scrapedData: JSON.stringify(updatedScrapedData),
      });

      console.log(`[deep-research-callback] Successfully processed data for ${startupName}`);

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
