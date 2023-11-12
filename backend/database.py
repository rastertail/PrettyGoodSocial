from functools import lru_cache

from sqlalchemy import Column, LargeBinary, MetaData, Table, String
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine


@lru_cache
def db() -> AsyncEngine:
    return create_async_engine("postgresql+asyncpg://postgres@localhost:5432/postgres")


@lru_cache
def metadata() -> MetaData:
    return MetaData()


@lru_cache
def user_table() -> Table:
    return Table(
        "users",
        metadata(),
        Column("key", LargeBinary, primary_key=True, nullable=False),
        Column("name", String, nullable=False),
    )
