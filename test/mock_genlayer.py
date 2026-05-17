"""
Minimal GenLayer runtime mock for local unit testing.
Simulates gl.Contract, gl.TreeMap, gl.Address, gl.message, gl.send,
gl.nondet, gl.eq_principle, and the event/decorator system.
"""
import json
import sys
import types
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, Generic, TypeVar

# ── Address ──────────────────────────────────────────────────────────────────

class Address(str):
    pass

# ── TreeMap ───────────────────────────────────────────────────────────────────

K = TypeVar("K")
V = TypeVar("V")


class TreeMap(Generic[K, V]):
    """Dict-backed ordered map."""

    def __init__(self):
        self._data: Dict[Any, Any] = {}

    def __class_getitem__(cls, _):
        return cls

    def get(self, key, default=None):
        return self._data.get(key, default)

    def __setitem__(self, key, value):
        self._data[key] = value

    def __getitem__(self, key):
        return self._data[key]

    def __contains__(self, key):
        return key in self._data


# ── Event ─────────────────────────────────────────────────────────────────────

_emitted_events: list = []


class Event:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        fields = list(cls.__annotations__.keys()) if hasattr(cls, "__annotations__") else []
        cls._fields = fields

    def __init__(self, *args):
        for name, val in zip(self._fields, args):
            setattr(self, name, val)

    def emit(self):
        _emitted_events.append(self)


def get_emitted_events():
    return list(_emitted_events)


def clear_events():
    _emitted_events.clear()


# ── Message context ───────────────────────────────────────────────────────────

class _Message:
    sender: Address = Address("0xClient0000000000000000000000000000000001")
    value: int = 0
    timestamp: int = 1_000_000


message = _Message()


def set_sender(addr: str):
    message.sender = Address(addr)


def set_value(v: int):
    message.value = v


# ── Ledger ────────────────────────────────────────────────────────────────────

_balances: Dict[str, int] = {}
_contract_balance: int = 0


def reset_ledger():
    global _contract_balance
    _balances.clear()
    _contract_balance = 0


def fund_contract(amount: int):
    global _contract_balance
    _contract_balance += amount


def send(addr: Address, amount: int):
    global _contract_balance
    if amount > _contract_balance:
        raise ValueError(f"Insufficient contract balance: has {_contract_balance}, needs {amount}")
    _contract_balance -= amount
    _balances[str(addr)] = _balances.get(str(addr), 0) + amount


def get_balance(addr: str) -> int:
    return _balances.get(addr, 0)


def get_contract_balance() -> int:
    return _contract_balance


# ── Non-deterministic / AI ────────────────────────────────────────────────────

class _NondetWeb:
    _responses: Dict[str, str] = {}

    def register(self, url: str, content: str):
        self._responses[url] = content

    def get(self, url: str):
        content = self._responses.get(url, "")
        obj = types.SimpleNamespace()
        obj.text = content
        return obj


class _Nondet:
    web = _NondetWeb()
    _prompt_response: dict = {"approved": True, "reasoning": "Work looks good.", "confidence": "high"}

    def set_prompt_response(self, resp: dict):
        self._prompt_response = resp

    def exec_prompt(self, prompt: str, response_format: str = "json"):
        return dict(self._prompt_response)


nondet = _Nondet()


class _EqPrinciple:
    def strict_eq(self, fn: Callable) -> Any:
        # In the mock, just call the function directly.
        return fn()


eq_principle = _EqPrinciple()


# ── Decorators ────────────────────────────────────────────────────────────────

class _Public:
    class write:
        def __init__(self, fn):
            self._fn = fn

        def __set_name__(self, owner, name):
            setattr(owner, name, self._fn)

        def __call__(self, *args, **kwargs):
            return self._fn(*args, **kwargs)

    class view:
        def __init__(self, fn):
            self._fn = fn

        def __set_name__(self, owner, name):
            setattr(owner, name, self._fn)

        def __call__(self, *args, **kwargs):
            return self._fn(*args, **kwargs)


public = _Public()


# ── Contract base ─────────────────────────────────────────────────────────────

class Contract:
    pass


# ── Build the `gl` module object ──────────────────────────────────────────────

gl = types.ModuleType("genlayer.gl")
gl.Contract = Contract
gl.Event = Event
gl.Address = Address
gl.TreeMap = TreeMap
gl.message = message
gl.send = send
gl.nondet = nondet
gl.eq_principle = eq_principle
gl.public = public

# Inject so `from genlayer import *` / `import genlayer as gl` both work
genlayer_mod = types.ModuleType("genlayer")
genlayer_mod.gl = gl
# `from genlayer import *` exposes gl
genlayer_mod.__all__ = ["gl"]
sys.modules["genlayer"] = genlayer_mod
sys.modules["genlayer.gl"] = gl
