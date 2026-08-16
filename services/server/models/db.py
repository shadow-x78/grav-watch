# GravWatch - Database Models (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

try:
    from services.server.core.database import Base
except ImportError:
    from ..core.database import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String(64), primary_key=True, index=True)
    label = Column(String(128), nullable=False)
    email = Column(String(255), default="unknown")
    tier = Column(String(64), default="Standard")
    status = Column(String(32), default="healthy")
    last_seen_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    snapshots = relationship("UsageSnapshot", back_populates="account", cascade="all, delete-orphan")


class UsageSnapshot(Base):
    __tablename__ = "usage_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(String(64), ForeignKey("accounts.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    account = relationship("Account", back_populates="snapshots")
    categories = relationship("CategorySnapshot", back_populates="snapshot", cascade="all, delete-orphan")
    models = relationship("ModelQuota", back_populates="snapshot", cascade="all, delete-orphan")


class CategorySnapshot(Base):
    __tablename__ = "category_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    snapshot_id = Column(Integer, ForeignKey("usage_snapshots.id"), nullable=False, index=True)
    category_id = Column(String(64), nullable=False, index=True)
    category_name = Column(String(128), nullable=False)
    weekly_remaining = Column(Float, nullable=False, default=100.0)
    weekly_refresh_human = Column(String(128), default="")
    five_hour_remaining = Column(Float, nullable=False, default=100.0)
    five_hour_refresh_human = Column(String(128), default="")

    snapshot = relationship("UsageSnapshot", back_populates="categories")


class ModelQuota(Base):
    __tablename__ = "model_quotas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    snapshot_id = Column(Integer, ForeignKey("usage_snapshots.id"), nullable=False, index=True)
    model_id = Column(String(64), nullable=False, index=True)
    model_name = Column(String(128), nullable=False)
    category_id = Column(String(64), nullable=False, default="gemini-models")
    weekly_remaining = Column(Float, nullable=False, default=100.0)
    weekly_refresh_human = Column(String(128), default="")
    five_hour_remaining = Column(Float, nullable=False, default=100.0)
    five_hour_refresh_human = Column(String(128), default="")

    snapshot = relationship("UsageSnapshot", back_populates="models")
