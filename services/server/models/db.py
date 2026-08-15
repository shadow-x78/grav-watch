# GravWatch - Database Models (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
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
    models = relationship("ModelQuota", back_populates="snapshot", cascade="all, delete-orphan")


class ModelQuota(Base):
    __tablename__ = "model_quotas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    snapshot_id = Column(Integer, ForeignKey("usage_snapshots.id"), nullable=False, index=True)
    model_id = Column(String(64), nullable=False, index=True)
    model_name = Column(String(128), nullable=False)
    used = Column(Integer, nullable=False, default=0)
    limit = Column(Integer, nullable=False, default=0)
    percentage = Column(Float, nullable=False, default=0.0)
    unit = Column(String(32), default="requests")
    resets_in_human = Column(String(64), default="")
    resets_at = Column(DateTime, nullable=True)

    snapshot = relationship("UsageSnapshot", back_populates="models")
