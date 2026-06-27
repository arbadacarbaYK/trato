"""Pydantic model → dict (v1 and v2 compatible)."""

from __future__ import annotations

from typing import Any


def model_to_dict(model: Any) -> dict:
    if hasattr(model, "model_dump"):
        return model.model_dump()
    if hasattr(model, "dict"):
        return model.dict()
    raise TypeError(f"expected Pydantic model, got {type(model)!r}")
