import asyncio
import os
from typing import List
from dotenv import load_dotenv
import json
from browser_use import Agent, Browser, ChatGoogle, Tools
from browser_use_sdk import BrowserUse

# from models import Company, Founder, FounderList, SocialMedia, Hype  # your Pydantic models from models.py
from .models import Company, Founder, FounderList, CompetitorList, Competitor, SocialMedia, Hype  # your Pydantic models from models.py

load_dotenv()

client = BrowserUse(api_key=os.getenv("BROWSER_USE_API_KEY"))

async def analyze_company(company_name: str) -> tuple:
    tools = Tools()
    llm = ChatGoogle(model="gemini-flash-latest")

    browser = Browser(
        use_cloud=True,
        keep_alive=True
    )

    # IMPORTANT: match the keys to your Company model (company_website, not official_website)
    task = f"""
    1) Navigate to https://www.google.com and search for "{company_name} startup"
    2) From the search results, find the official website for the company
    3) Once on the official website, determine the main mission of the company, write a brief biography of the company, and store this in "company_bio"
        - If you are unable to find an official website, make a biography based on other reputable sources you find and store this in "company_bio"
    4) Find ONLY THE NAMES of the founders of the company. You could do this by doing a simple google search. Preferably you find the founders, CEO, and CTO.
        - in the schema, store the names in the name field of each founder in "founders_info", and leave the other fields blank for now
    5) Then create a summary of their achievements and what the company has done so far and store this is "company_summary"
    - If you cannot find the official website, use "None"
    - Create todos for each action you will take
    - Provide a structured JSON only (no extra text) in the following format:
    {{
      "company_website": string (or "None"),
      "founders_info": [
        {{
          "name": string,
          "social_media": {{
              "linkedin": string (or "None"),
              "X": string (or "None"),
              "other": string (or "None")
          }},
          "personal_website": string (or "None"),
          "bio": string (or "None")
        }}
      ],
      "company_bio": string (or "None"),
      "company_summary": string (or "None")
    }}
    """

    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
        tools=tools,
        available_file_paths=[],
        output_model_schema=Company,
    )

    history = await agent.run()

    result = history.final_result()
    if result:
        parsed: Company = Company.model_validate_json(result)

        for founder in parsed.founders_info:
            print('\n--------------------------------')
            print(f'Name:              {founder.name}')
            print(f'Social Media:      {founder.social_media}')
            print(f'Personal Website:  {founder.personal_website}')
            print(f'Bio:              {founder.bio}')
        return parsed, browser
    else:
        print('No result')
        raise Exception("Failed to analyze company")

async def research_founders(company_name: str, founders: FounderList) -> dict:
    founder_names = [f.name for f in founders]

    task = f"""
        - Use Google to research and provide detailed information about the founders of {company_name}
        - The founders are: {founder_names}
        - For each founder, find their linkedin and X profiles
            - You should be able to get this information by doing a simple google search, and you don't have to click on the link to verify. For each founder, create todos for the following actions:
                - Google search for "[INSERT FOUNDER NAME] {company_name} LinkedIn", save the first result that is mostly related to [INSERT FOUNDER NAME] and the company
                - Google search for "[INSERT FOUNDER NAME] {company_name} X profile", save the first result that is mostly related to [INSERT FOUNDER NAME] and the company
        - With this information, create a brief bio for each founder based on their background and experience. You should be able to get these from the google summaries under the links.
        - **IMPORTANT** ensure that the people you find are actually related to the company, and not some other person with the same name.
            - You can do this by verifying that somewhere in their linkedin or X profile, it mentions the company name and/or their role in the company. You could do this by checking the "About" section of their linkedin profile, or their bio on X.
            - If the linkedin or X profile does not mention the company name, leave the respective field as "None"
            - Each search query should be with search_engine='google'
        - Return ONLY a JSON array where each item matches this schema exactly:
        {{
            founders: [
                {{
                    "name": string,
                    "social_media": {{
                        "linkedin": string (or "None"),
                        "X": string (or "None"),
                        "other": string (or "None")
                    }},
                    "personal_website": string (or "None"),
                    "bio": string (or "None")
                }}
            ]
        }}
    """

    # task = client.tasks.create_task(
    #     task=task,
    #     llm="gemini-flash-latest",
    #     schema=FounderList,  # browser_use_sdk can validate to this schema
    # )

    # print(f"Task ID: {task.id}")

    # result = task.complete()
    # return result.output

    tools = Tools()
    llm = ChatGoogle(model="gemini-flash-latest")

    browser = Browser(
        use_cloud=True,
        keep_alive=True
    )

    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
        tools=tools,
        available_file_paths=[],
        output_model_schema=FounderList,
        channel='chrome'
    )

    history = await agent.run()

    result = history.final_result()
    if result:
        parsed: FounderList = FounderList.model_validate_json(result)

        for founder in parsed:
            print('\n--------------------------------')
            print(f'Name:              {founder.name}')
            print(f'Social Media:      {founder.social_media}')
            print(f'Personal Website:  {founder.personal_website}')
            print(f'Bio:              {founder.bio}')
        return parsed, browser
    else:
        print('No result')
        return founders

async def research_hype(company_name: str) -> tuple:
    task = f"""
        - Use Google to research the hype and funding information for {company_name}
        - **Search Strategy - Execute these searches in order:**
            1. First search: "{company_name} startup funding raised"
            2. Second search: "{company_name} startup news"
            3. Third search: "{company_name} valuation series"
        - Scroll through the search results and read the summaries
        - **IMPORTANT**
            - Just use the google search results and the summaries under the links, do not click on any links
            - Create todos for each action you will take
            - IGNORE social media follower counts (LinkedIn, Twitter, etc.) - these are NOT funding metrics
            - Focus ONLY on actual funding raised, valuation, revenue, user counts, or growth statistics
        - Summarize your findings in a brief report and store it in "hype_summary"
        - Extract ONLY actual funding amounts (e.g., "$5M Series A", "$10M raised", "100K users"), revenue, or valuation - store in "numbers"
            - If you cannot find any real funding/revenue/user numbers, use "None"
            - Do NOT include social media follower counts
        - List the most recent news items or announcements about the company and store in "recent_news"
        - Provide a structured JSON only (no extra text) in the following format:
        {{
            "hype_summary": string,
            "numbers": string (or "None"),
            "recent_news": string (or "None")
        }}
    """

    tools = Tools()
    llm = ChatGoogle(model="gemini-flash-latest")

    browser = Browser(use_cloud=True, keep_alive=True)

    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
        tools=tools,
        available_file_paths=[],
        output_model_schema=Hype,
        channel='chrome'
    )

    history = await agent.run()

    result = history.final_result()
    if result:
        parsed: Hype = Hype.model_validate_json(result)
        print('\n--------------------------------')
        print(f'Hype Summary: {parsed.hype_summary}')
        print(f'Numbers: {parsed.numbers}')
        print(f'Recent News: {parsed.recent_news}')
        return parsed, browser
    else:
        print('No result')
        raise Exception("Failed to research hype")

async def research_competitors(company_name: str, company_bio: str = None, company_website: str = None) -> tuple:
    context = f"""
    Company: {company_name}
    """
    if company_website and company_website != "None":
        context += f"\nWebsite: {company_website}"
    if company_bio and company_bio != "None":
        context += f"\nWhat they do: {company_bio}"

    # Build search strategy based on available information
    search_strategies = []
    if company_bio and company_bio != "None":
        # Extract key terms from bio for more relevant searches
        search_strategies.append(f'Search for startups/companies that do similar things by querying variations like: "startups similar to [key terms from bio]", "alternatives to [key product/service]", "competitors in [industry/space]"')
    search_strategies.append(f'Search for "{company_name} competitors"')
    search_strategies.append(f'Search for "{company_name} alternatives"')

    search_strategy_text = "\n            ".join([f"{i+1}. {s}" for i, s in enumerate(search_strategies)])

    task = f"""
        - You are researching competitors for the following company:
        {context}

        - **SEARCH STRATEGY** - Use these approaches in order to find the most relevant competitors:
            {search_strategy_text}

        - Since this is a startup, prioritize finding competitors based on WHAT THEY DO rather than just the company name
        - Identify the top 5 most relevant direct competitors that operate in the same space

        - **IMPORTANT**
            - For EACH competitor you find, do thorough research with multiple targeted searches:
                1. Search for "[competitor name] startup" to find their official website
                2. Search for "[competitor name] funding raised" to find funding information
                3. Search for "[competitor name] product features" to understand what they offer
                4. Search for "[competitor name] news" to get recent updates
            - Use the google search results and summaries to compile comprehensive information
            - Do not click on links, just use the search result summaries
            - Create todos for each research action you will take

        - For each competitor, compile a detailed description that includes:
            - What they do (core product/service)
            - Key features or differentiators
            - Funding status or traction metrics if available
            - Recent news or developments

        - Return ONLY a JSON object where each item matches this schema exactly:
        {{
            "competitors": [
                {{
                    "name": string,
                    "website": string (or "None"),
                    "description": string (detailed description based on research, or "None")
                }}
            ]
        }}
    """

    tools = Tools()
    llm = ChatGoogle(model="gemini-flash-latest")

    browser = Browser(use_cloud=True, keep_alive=True)

    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
        tools=tools,
        available_file_paths=[],
        output_model_schema=CompetitorList,
        channel='chrome'
    )

    history = await agent.run()

    result = history.final_result()
    if result:
        parsed: CompetitorList = CompetitorList.model_validate_json(result)
        print('\n--------------------------------')
        for competitor in parsed:
            print(f'Competitor: {competitor.name}')
            print(f'Website: {competitor.website}')
            print(f'Description: {competitor.description}')
            print('--------------------------------')
        return parsed, browser
    else:
        print('No result')
        raise Exception("Failed to find competitors")

async def main():
    # company_name = "ThirdLayer"
    # founders = FounderList.model_construct(founders=[
    #     Founder(
    #         name="Regina Lin",
    #         social_media=SocialMedia(),
    #         personal_website=None,
    #         bio=None
    #     ),
    #     Founder(
    #         name="Kevin Gu",
    #         social_media=SocialMedia(),
    #         personal_website=None,
    #         bio=None
    #     )
    # ])

    # company = await analyze_company(company_name)

    # founders = await research_founders(company_name, company.founders_info)

    # company.founders_info = founders

    # print("\nFinal Company Info:")
    # print(company)
    return None

if __name__ == "__main__":
    asyncio.run(main())
