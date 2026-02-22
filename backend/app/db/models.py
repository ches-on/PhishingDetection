from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from .database import Base

class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    verdict = Column(String(10), nullable=False)
    risk_score = Column(Integer, nullable=False)

    subject = Column(Text, nullable=True)
    from_header = Column(Text, nullable=True)
    reply_to = Column(Text, nullable=True)
    to_header = Column(Text, nullable=True)

    urls_json = Column(Text, nullable=False)      # store JSON string
    findings_json = Column(Text, nullable=False)  # store JSON string
    extracted_json = Column(Text, nullable=False)