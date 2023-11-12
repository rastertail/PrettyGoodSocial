from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine


def get() -> AsyncEngine:
    return create_async_engine("postgresql+asyncpg://postgres@localhost:5432/postgres")
