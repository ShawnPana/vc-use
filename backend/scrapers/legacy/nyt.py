from browser_use_sdk import BrowserUse
from dotenv import load_dotenv
import os
from pathlib import Path
from .models import Articles

# Load .env.local from parent directory
env_path = Path(__file__).parent.parent / '.env.local'
load_dotenv(env_path)

client = BrowserUse(api_key=os.getenv("BROWSER_USE_API_KEY"))

def search_nyt(query: str) -> dict:
    task = client.tasks.create_task(
        task=f"""
        - Catagorize the following query as 'business' or 'technology': {query}
            - If 'business', catagorize the query as 'economy', 'media', 'your-money', 'small-business', or 'mutual-funds'
                - Navigate to https://www.nytimes.com/section/{{category}} based on your catagorization
            - If 'technology', catagorize the query as 'personaltech' or 'general'
                - If 'personaltech', navigate to https://www.nytimes.com/section/technology/personaltech
                - If 'general', navigate to https://www.nytimes.com/section/technology
        - Find the top 3 articles latest and most related to the query
        - Extract the relevant information from the articles by looking at their headlines and summaries.
        - Provide a structured output in the following format:
        {{
            articles: [
                {{
                    headline: string,
                    summary: string,
                    url: string
                }}
            ]
        }}
        """,
        llm="gemini-flash-latest",
        schema=Articles,
    )

    print(f"Task ID: {task.id}")

    result = task.complete()

    # Parse the JSON string output
    import json
    if result.output:
        if isinstance(result.output, str):
            return json.loads(result.output)
        return result.output
    return {"articles": []}

if __name__ == '__main__':
    query = "artificial intelligence"
    results = search_nyt(query)
    print("Search Results:", results)