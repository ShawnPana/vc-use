import asyncio
import httpx
from celery_app import celery_app
from scrapers.analyze_company import analyze_company, research_founders, research_hype, research_competitors
from scrapers.models import FounderList

@celery_app.task(bind=True, name='tasks.full_analysis_task')
def full_analysis_task(self, company_name: str, callback_url: str = None, api_key: str = None):
    """
    Background task for full company analysis.
    Runs analyze_company and research_hype in parallel.
    """
    try:
        print(f"🔄 [Celery Task {self.request.id}] Starting full analysis for: {company_name}")

        # Run async functions in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            # Run analyze_company and research_hype in parallel
            results = loop.run_until_complete(
                asyncio.gather(
                    analyze_company(company_name),
                    research_hype(company_name)
                )
            )

            (company, browser1), (hype, browser2) = results

            # Stop both browsers
            loop.run_until_complete(browser1.stop())
            loop.run_until_complete(browser2.stop())

            # Give background tasks time to finish cleanup
            loop.run_until_complete(asyncio.sleep(1))

            # Cancel any remaining tasks
            pending = asyncio.all_tasks(loop)
            for task in pending:
                task.cancel()

            # Wait for cancellations to complete
            if pending:
                loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))

            print(f"✅ [Celery Task {self.request.id}] Completed scraping for: {company_name}")

            # Convert to dict for JSON serialization
            result = {
                "company": company.model_dump(),
                "hype": hype.model_dump()
            }

            # If callback URL provided, send results there
            if callback_url:
                try:
                    with httpx.Client(timeout=30.0) as client:
                        response = client.post(
                            callback_url,
                            json={
                                "startupName": company_name,
                                "company": result["company"],
                                "hype": result["hype"],
                                "taskStatus": "completed"
                            },
                            headers={
                                "Content-Type": "application/json",
                                "X-API-Key": api_key
                            } if api_key else {"Content-Type": "application/json"}
                        )
                        response.raise_for_status()
                    print(f"✅ [Celery Task {self.request.id}] Sent full analysis results to callback: {callback_url}")
                except Exception as callback_error:
                    print(f"⚠️ [Celery Task {self.request.id}] Failed to send callback: {callback_error}")

            return {
                "success": True,
                "company_name": company_name,
                "result": result
            }

        finally:
            # Don't close the loop - let it be garbage collected
            # Closing causes "Event loop is closed" errors in worker process reuse
            pass

    except Exception as e:
        print(f"❌ [Celery Task {self.request.id}] Error in full analysis for {company_name}: {e}")

        # Check if we've exhausted retries
        if self.request.retries >= self.max_retries:
            print(f"❌ [Celery Task {self.request.id}] Max retries reached, sending failure callback")
            # Send failure callback if we've exhausted retries
            if callback_url:
                try:
                    with httpx.Client(timeout=30.0) as client:
                        client.post(
                            callback_url,
                            json={
                                "startupName": company_name,
                                "taskStatus": "failed",
                                "error": str(e)
                            },
                            headers={
                                "Content-Type": "application/json",
                                "X-API-Key": api_key
                            } if api_key else {"Content-Type": "application/json"}
                        )
                    print(f"✅ [Celery Task {self.request.id}] Sent failure callback")
                except Exception as callback_error:
                    print(f"⚠️ [Celery Task {self.request.id}] Failed to send failure callback: {callback_error}")
            # Don't retry anymore
            raise e

        # Retry the task if we haven't exhausted retries
        raise self.retry(exc=e)


@celery_app.task(bind=True, name='tasks.deep_research_task')
def deep_research_task(
    self,
    company_name: str,
    founders_dict: dict,
    company_bio: str = None,
    company_website: str = None,
    callback_url: str = None,
    api_key: str = None
):
    """
    Background task for deep research.
    Runs research_founders and research_competitors in parallel.
    """
    try:
        print(f"🔄 [Celery Task {self.request.id}] Starting deep research for: {company_name}")

        # Reconstruct FounderList from dict
        founders = FounderList.model_validate(founders_dict)

        # Run async functions in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            # Run research_founders and research_competitors in parallel
            results = loop.run_until_complete(
                asyncio.gather(
                    research_founders(company_name, founders),
                    research_competitors(company_name, company_bio, company_website)
                )
            )

            (founders_result, browser1), (competitors, browser2) = results

            # Stop both browsers
            loop.run_until_complete(browser1.stop())
            loop.run_until_complete(browser2.stop())

            # Give background tasks time to finish cleanup
            loop.run_until_complete(asyncio.sleep(1))

            # Cancel any remaining tasks
            pending = asyncio.all_tasks(loop)
            for task in pending:
                task.cancel()

            # Wait for cancellations to complete
            if pending:
                loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))

            print(f"✅ [Celery Task {self.request.id}] Completed deep research for: {company_name}")

            # Convert to dict for JSON serialization
            result = {
                "founders": founders_result.model_dump(),
                "competitors": competitors.model_dump()
            }

            # If callback URL provided, send results there
            if callback_url:
                try:
                    with httpx.Client(timeout=30.0) as client:
                        response = client.post(
                            callback_url,
                            json={
                                "startupName": company_name,
                                "founders": result["founders"],
                                "competitors": result["competitors"],
                                "taskStatus": "completed"
                            },
                            headers={
                                "Content-Type": "application/json",
                                "X-API-Key": api_key
                            } if api_key else {"Content-Type": "application/json"}
                        )
                        response.raise_for_status()
                    print(f"✅ [Celery Task {self.request.id}] Sent deep research results to callback: {callback_url}")
                except Exception as callback_error:
                    print(f"⚠️ [Celery Task {self.request.id}] Failed to send callback: {callback_error}")

            return {
                "success": True,
                "company_name": company_name,
                "result": result
            }

        finally:
            # Don't close the loop - let it be garbage collected
            # Closing causes "Event loop is closed" errors in worker process reuse
            pass

    except Exception as e:
        print(f"❌ [Celery Task {self.request.id}] Error in deep research for {company_name}: {e}")

        # Check if we've exhausted retries
        if self.request.retries >= self.max_retries:
            print(f"❌ [Celery Task {self.request.id}] Max retries reached, sending failure callback")
            # Send failure callback if we've exhausted retries
            if callback_url:
                try:
                    with httpx.Client(timeout=30.0) as client:
                        client.post(
                            callback_url,
                            json={
                                "startupName": company_name,
                                "taskStatus": "failed",
                                "error": str(e)
                            },
                            headers={
                                "Content-Type": "application/json",
                                "X-API-Key": api_key
                            } if api_key else {"Content-Type": "application/json"}
                        )
                    print(f"✅ [Celery Task {self.request.id}] Sent failure callback")
                except Exception as callback_error:
                    print(f"⚠️ [Celery Task {self.request.id}] Failed to send failure callback: {callback_error}")
            # Don't retry anymore
            raise e

        # Retry the task if we haven't exhausted retries
        raise self.retry(exc=e)
