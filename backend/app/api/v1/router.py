from fastapi import APIRouter

from app.api.v1 import auth, projects, papers, assistant, gap_analysis, reviews, analytics

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(papers.router, prefix="/projects/{project_id}/papers", tags=["Papers"])
api_router.include_router(assistant.router, prefix="/projects/{project_id}/assistant", tags=["Assistant"])
api_router.include_router(gap_analysis.router, prefix="/projects/{project_id}/gap-analysis", tags=["Gap Analysis"])
api_router.include_router(reviews.router, prefix="/projects/{project_id}/reviews", tags=["Literature Reviews"])
api_router.include_router(analytics.router, prefix="/projects/{project_id}/analytics", tags=["Analytics"])
