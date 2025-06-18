from fastapi import APIRouter
from .data_router import router as data_router
from .query_router import router as query_router
from .data_extraction import router as data_extraction_router
from .auth_router import router as auth_router

router = APIRouter()

router.include_router(data_router, prefix="/data", tags=["data"])
router.include_router(query_router, prefix="/query", tags=["query"])
router.include_router(data_extraction_router, tags=["data_extraction"])
router.include_router(auth_router, prefix="/auth", tags=["auth"])
