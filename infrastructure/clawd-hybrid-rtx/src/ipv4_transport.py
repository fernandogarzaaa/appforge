"""IPv4-only HTTP transport to avoid IPv6 connection issues on Windows."""

import socket
import httpx


# Monkey-patch socket to prefer IPv4
_original_socket_connect = None


def _ipv4_connect(self, address):
    """Force IPv4 resolution when connecting."""
    if isinstance(address, tuple) and len(address) == 2:
        host, port = address
        if host and not all(c.isdigit() or c == '.' for c in host):  # Not already an IP
            try:
                # Try IPv4 first
                infos = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM)
                if infos:
                    address = infos[0][4]
            except socket.gaierror:
                pass  # Fall back to original address
    return _original_socket_connect(self, address)


def enable_ipv4_only():
    """Monkey-patch socket.socket.connect to prefer IPv4 addresses."""
    global _original_socket_connect
    if _original_socket_connect is None:
        _original_socket_connect = socket.socket.connect
        socket.socket.connect = _ipv4_connect
